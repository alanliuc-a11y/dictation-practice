/**
 * 小学生每日练习系统 - 后端服务
 * Node.js + Express + SQLite
 * 提供词库、错题本、历史记录的 RESTful API
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const tencentcloud = require("tencentcloud-sdk-nodejs");

const TtsClient = tencentcloud.tts.v20190823.Client;

const app = express();
const PORT = process.env.PORT || 3000;

// 读取配置
let ttsClient = null;
try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.tencent && config.tencent.secretId && config.tencent.secretKey) {
      ttsClient = new TtsClient({
        credential: {
          secretId: config.tencent.secretId,
          secretKey: config.tencent.secretKey,
        },
        region: "ap-beijing",
        profile: {
          httpProfile: {
            endpoint: "tts.tencentcloudapi.com",
          },
        },
      });
      console.log('✅ 腾讯云 TTS 已配置');
    }
  }
} catch (e) {
  console.warn('⚠️ 腾讯云 TTS 配置失败:', e.message);
}

// ========== 中间件 ==========
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname))); // 托管前端静态文件
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio'))); // 托管音频文件

// ========== 数据库初始化 ==========
const DB_PATH = path.join(__dirname, 'data', 'app.db');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// 开启 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 创建表
db.exec(`
  -- 基础词库（语文/英语/数学）
  CREATE TABLE IF NOT EXISTS builtin_vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,          -- chinese / english / math
    grade TEXT NOT NULL,            -- grade2_semester1 / grade2_semester2
    lesson_key TEXT NOT NULL,       -- lesson1, s2_lesson1 等
    name TEXT NOT NULL,             -- 课文/单元名称
    vocab_type TEXT DEFAULT 'word', -- word / poem / knowledge
    words TEXT DEFAULT '[]',        -- JSON: [{text, pinyin}, ...]
    knowledge_points TEXT DEFAULT '[]', -- JSON: [{type, count}, ...] (数学用)
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(subject, grade, lesson_key)
  );

  -- 自定义词库
  CREATE TABLE IF NOT EXISTS custom_vocab (
    id TEXT PRIMARY KEY,            -- UUID
    name TEXT NOT NULL,
    subject TEXT NOT NULL,          -- chinese / english / math
    vocab_type TEXT DEFAULT 'word',
    words TEXT DEFAULT '[]',        -- JSON: [{text, pinyin/meaning}, ...]
    knowledge_points TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  -- 错题本
  CREATE TABLE IF NOT EXISTS wronglist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    pinyin TEXT DEFAULT '',
    subject TEXT DEFAULT 'chinese',
    review_count INTEGER DEFAULT 0,
    last_review_at TEXT,
    mastered INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  -- 历史记录
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    subject TEXT NOT NULL,
    total_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    words TEXT DEFAULT '[]',        -- JSON: 练习的词语列表
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_builtin_subject_grade ON builtin_vocab(subject, grade);
  CREATE INDEX IF NOT EXISTS idx_custom_subject ON custom_vocab(subject);
  CREATE INDEX IF NOT EXISTS idx_wronglist_subject ON wronglist(subject);
  CREATE INDEX IF NOT EXISTS idx_wronglist_mastered ON wronglist(mastered);
  CREATE INDEX IF NOT EXISTS idx_history_date ON history(date);
`);

console.log('✅ 数据库初始化完成');

// ========== 工具函数 ==========
function success(data = null, message = 'ok') {
  return { success: true, message, data };
}

function error(message = '操作失败', code = 400) {
  return { success: false, message, code };
}

// ========== API 路由 ==========

// --- 基础词库 API ---

// 获取基础词库列表
app.get('/api/builtin/:subject/:grade', (req, res) => {
  try {
    const { subject, grade } = req.params;
    const rows = db.prepare(
      'SELECT lesson_key, name, vocab_type, words, knowledge_points FROM builtin_vocab WHERE subject = ? AND grade = ? ORDER BY lesson_key'
    ).all(subject, grade);

    const lessons = rows.map(r => ({
      key: r.lesson_key,
      name: r.name,
      vocabType: r.vocab_type,
      words: JSON.parse(r.words || '[]'),
      knowledgePoints: JSON.parse(r.knowledge_points || '[]'),
      wordCount: JSON.parse(r.words || '[]').length || JSON.parse(r.knowledge_points || '[]').length
    }));

    res.json(success(lessons));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 获取单个课文
app.get('/api/builtin/:subject/:grade/:lessonKey', (req, res) => {
  try {
    const { subject, grade, lessonKey } = req.params;
    const row = db.prepare(
      'SELECT * FROM builtin_vocab WHERE subject = ? AND grade = ? AND lesson_key = ?'
    ).get(subject, grade, lessonKey);

    if (!row) return res.status(404).json(error('课文不存在', 404));

    res.json(success({
      key: row.lesson_key,
      name: row.name,
      vocabType: row.vocab_type,
      words: JSON.parse(row.words || '[]'),
      knowledgePoints: JSON.parse(row.knowledge_points || '[]')
    }));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 保存课文（新增或更新）
app.put('/api/builtin/:subject/:grade/:lessonKey', (req, res) => {
  try {
    const { subject, grade, lessonKey } = req.params;
    const { name, vocabType, words, knowledgePoints } = req.body;

    if (!name) return res.status(400).json(error('课文名称不能为空'));

    const wordsJson = JSON.stringify(words || []);
    const kpJson = JSON.stringify(knowledgePoints || []);

    db.prepare(`
      INSERT INTO builtin_vocab (subject, grade, lesson_key, name, vocab_type, words, knowledge_points, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      ON CONFLICT(subject, grade, lesson_key) DO UPDATE SET
        name = excluded.name,
        vocab_type = excluded.vocab_type,
        words = excluded.words,
        knowledge_points = excluded.knowledge_points,
        updated_at = datetime('now', 'localtime')
    `).run(subject, grade, lessonKey, name, vocabType || 'word', wordsJson, kpJson);

    res.json(success(null, '保存成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 删除课文
app.delete('/api/builtin/:subject/:grade/:lessonKey', (req, res) => {
  try {
    const { subject, grade, lessonKey } = req.params;
    const result = db.prepare(
      'DELETE FROM builtin_vocab WHERE subject = ? AND grade = ? AND lesson_key = ?'
    ).run(subject, grade, lessonKey);

    if (result.changes === 0) return res.status(404).json(error('课文不存在', 404));
    res.json(success(null, '删除成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 导出所有基础词库
app.get('/api/builtin/export', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM builtin_vocab ORDER BY subject, grade, lesson_key').all();
    const data = {};
    rows.forEach(r => {
      if (!data[r.subject]) data[r.subject] = {};
      if (!data[r.subject][r.grade]) data[r.subject][r.grade] = {};
      data[r.subject][r.grade][r.lesson_key] = {
        name: r.name,
        vocabType: r.vocab_type,
        words: JSON.parse(r.words || '[]'),
        knowledgePoints: JSON.parse(r.knowledge_points || '[]')
      };
    });
    res.json(success(data));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 导入基础词库
app.post('/api/builtin/import', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json(error('缺少数据'));

    const insert = db.prepare(`
      INSERT OR REPLACE INTO builtin_vocab (subject, grade, lesson_key, name, vocab_type, words, knowledge_points, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `);

    const transaction = db.transaction(() => {
      for (const [subject, grades] of Object.entries(data)) {
        for (const [grade, lessons] of Object.entries(grades)) {
          for (const [key, lesson] of Object.entries(lessons)) {
            insert.run(
              subject, grade, key, lesson.name || key,
              lesson.vocabType || 'word',
              JSON.stringify(lesson.words || []),
              JSON.stringify(lesson.knowledgePoints || [])
            );
          }
        }
      }
    });

    transaction();
    res.json(success(null, '导入成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 重置基础词库（清空）
app.post('/api/builtin/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM builtin_vocab').run();
    res.json(success(null, '已重置'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// --- 自定义词库 API ---

// 获取所有自定义词库
app.get('/api/custom', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM custom_vocab ORDER BY updated_at DESC').all();
    const list = rows.map(r => ({
      id: r.id,
      name: r.name,
      subject: r.subject,
      vocabType: r.vocab_type,
      words: JSON.parse(r.words || '[]'),
      knowledgePoints: JSON.parse(r.knowledge_points || '[]'),
      wordCount: JSON.parse(r.words || '[]').length
    }));
    res.json(success(list));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 获取单个自定义词库
app.get('/api/custom/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM custom_vocab WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json(error('词库不存在', 404));
    res.json(success({
      id: row.id,
      name: row.name,
      subject: row.subject,
      vocabType: row.vocab_type,
      words: JSON.parse(row.words || '[]'),
      knowledgePoints: JSON.parse(row.knowledge_points || '[]')
    }));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 保存自定义词库
app.put('/api/custom/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, vocabType, words, knowledgePoints } = req.body;

    if (!name) return res.status(400).json(error('词库名称不能为空'));

    db.prepare(`
      INSERT OR REPLACE INTO custom_vocab (id, name, subject, vocab_type, words, knowledge_points, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(id, name, subject, vocabType || 'word', JSON.stringify(words || []), JSON.stringify(knowledgePoints || []));

    res.json(success(null, '保存成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 删除自定义词库
app.delete('/api/custom/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM custom_vocab WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json(error('词库不存在', 404));
    res.json(success(null, '删除成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// --- 错题本 API ---

app.get('/api/wronglist', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM wronglist ORDER BY created_at DESC').all();
    const list = rows.map(r => ({
      id: r.id,
      text: r.text,
      pinyin: r.pinyin,
      subject: r.subject,
      reviewCount: r.review_count,
      lastReviewAt: r.last_review_at,
      mastered: !!r.mastered
    }));
    res.json(success(list));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

app.post('/api/wronglist', (req, res) => {
  try {
    const { text, pinyin, subject } = req.body;
    if (!text) return res.status(400).json(error('词语不能为空'));

    // 去重：同一词语不重复添加
    const existing = db.prepare('SELECT id FROM wronglist WHERE text = ? AND subject = ?').get(text, subject || 'chinese');
    if (existing) return res.json(success({ id: existing.id }, '已存在'));

    const result = db.prepare(
      'INSERT INTO wronglist (text, pinyin, subject) VALUES (?, ?, ?)'
    ).run(text, pinyin || '', subject || 'chinese');

    res.json(success({ id: result.lastInsertRowid }, '添加成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

app.put('/api/wronglist/:id', (req, res) => {
  try {
    const { mastered, reviewCount } = req.body;
    if (mastered !== undefined) {
      db.prepare(
        'UPDATE wronglist SET mastered = ?, review_count = review_count + 1, last_review_at = datetime(\'now\', \'localtime\') WHERE id = ?'
      ).run(mastered ? 1 : 0, req.params.id);
    }
    if (reviewCount !== undefined) {
      db.prepare(
        'UPDATE wronglist SET review_count = ?, last_review_at = datetime(\'now\', \'localtime\') WHERE id = ?'
      ).run(reviewCount, req.params.id);
    }
    res.json(success(null, '更新成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

app.delete('/api/wronglist/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM wronglist WHERE id = ?').run(req.params.id);
    res.json(success(null, '删除成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

app.delete('/api/wronglist', (req, res) => {
  try {
    db.prepare('DELETE FROM wronglist').run();
    res.json(success(null, '已清空'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// --- 历史记录 API ---

app.get('/api/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM history ORDER BY created_at DESC LIMIT 100').all();
    const list = rows.map(r => ({
      id: r.id,
      date: r.date,
      subject: r.subject,
      totalCount: r.total_count,
      correctCount: r.correct_count,
      wrongCount: r.wrong_count,
      words: JSON.parse(r.words || '[]')
    }));
    res.json(success(list));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

app.post('/api/history', (req, res) => {
  try {
    const { date, subject, totalCount, correctCount, wrongCount, words } = req.body;
    const result = db.prepare(
      'INSERT INTO history (date, subject, total_count, correct_count, wrong_count, words) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(date, subject, totalCount || 0, correctCount || 0, wrongCount || 0, JSON.stringify(words || []));

    res.json(success({ id: result.lastInsertRowid }, '添加成功'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

app.delete('/api/history', (req, res) => {
  try {
    db.prepare('DELETE FROM history').run();
    res.json(success(null, '已清空'));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// --- 语音合成 API ---

// 实时生成语音
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceType } = req.body;

    if (!text) {
      return res.status(400).json(error('文本不能为空'));
    }

    if (!ttsClient) {
      return res.status(503).json(error('语音服务未配置'));
    }

    // 从配置读取默认音色
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
    const defaultVoice = config.tts?.chinese?.voiceType || 101016;

    const params = {
      Text: text,
      VoiceType: voiceType || defaultVoice,
      Codec: "mp3",
      SampleRate: 16000,
      Speed: 0,
      Volume: 0,
      SessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const response = await ttsClient.TextToVoice(params);

    // 返回 base64 音频数据
    res.json(success({
      audio: response.Audio,
      format: 'mp3'
    }));
  } catch (e) {
    console.error('TTS 错误:', e.message);
    res.status(500).json(error(e.message, 500));
  }
});

// 获取音频文件（优先本地，没有则实时生成）
app.get('/api/audio/:text', async (req, res) => {
  try {
    const text = decodeURIComponent(req.params.text);
    const audioDir = path.join(__dirname, 'public', 'audio');

    // 生成文件名
    const fileName = Buffer.from(text).toString('base64').replace(/[+/=]/g, '_').substring(0, 32) + '.mp3';
    const filePath = path.join(audioDir, fileName);

    // 如果文件已存在，直接返回
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // 否则实时生成
    if (!ttsClient) {
      return res.status(503).json(error('语音服务未配置'));
    }

    const response = await ttsClient.TextToVoice({
      Text: text,
      VoiceType: 1001,
      Codec: "mp3",
      SampleRate: 16000,
    });

    // 保存文件
    const buffer = Buffer.from(response.Audio, 'base64');
    fs.writeFileSync(filePath, buffer);

    res.sendFile(filePath);
  } catch (e) {
    console.error('音频生成错误:', e.message);
    res.status(500).json(error(e.message, 500));
  }
});

// --- 数据迁移 API（localStorage → 数据库） ---

app.post('/api/migrate', (req, res) => {
  try {
    const { builtinVocab, customVocab, wronglist, history } = req.body;
    let count = 0;

    const insertBuiltin = db.prepare(`
      INSERT OR IGNORE INTO builtin_vocab (subject, grade, lesson_key, name, vocab_type, words, knowledge_points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCustom = db.prepare(`
      INSERT OR IGNORE INTO custom_vocab (id, name, subject, vocab_type, words, knowledge_points)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertWrong = db.prepare(`
      INSERT OR IGNORE INTO wronglist (text, pinyin, subject, review_count, mastered)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertHistory = db.prepare(`
      INSERT INTO history (date, subject, total_count, correct_count, wrong_count, words)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      // 迁移基础词库
      if (builtinVocab) {
        for (const [subject, grades] of Object.entries(builtinVocab)) {
          for (const [grade, lessons] of Object.entries(grades)) {
            for (const [key, lesson] of Object.entries(lessons)) {
              insertBuiltin.run(
                subject, grade, key, lesson.name || key,
                lesson.vocabType || 'word',
                JSON.stringify(lesson.words || []),
                JSON.stringify(lesson.knowledgePoints || [])
              );
              count++;
            }
          }
        }
      }

      // 迁移自定义词库
      if (customVocab && Array.isArray(customVocab)) {
        customVocab.forEach(v => {
          insertCustom.run(
            v.id, v.name || '未命名', v.subject || 'chinese',
            v.vocabType || 'word',
            JSON.stringify(v.words || []),
            JSON.stringify(v.knowledgePoints || [])
          );
          count++;
        });
      }

      // 迁移错题本
      if (wronglist && Array.isArray(wronglist)) {
        wronglist.forEach(w => {
          insertWrong.run(
            w.text || '', w.pinyin || '', w.subject || 'chinese',
            w.reviewCount || 0, w.mastered ? 1 : 0
          );
          count++;
        });
      }

      // 迁移历史记录
      if (history && Array.isArray(history)) {
        history.forEach(h => {
          insertHistory.run(
            h.date || '', h.subject || 'chinese',
            h.totalCount || 0, h.correctCount || 0, h.wrongCount || 0,
            JSON.stringify(h.words || [])
          );
          count++;
        });
      }
    });

    transaction();
    res.json(success({ count }, `迁移完成，共 ${count} 条数据`));
  } catch (e) {
    res.status(500).json(error(e.message, 500));
  }
});

// 所有其他请求返回 index.html（SPA 路由）
app.get('*', (req, res) => {
  // API 请求返回 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json(error('API 不存在', 404));
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== 启动服务器 ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('📚 小学生每日练习系统');
  console.log(`   服务已启动: http://localhost:${PORT}`);
  console.log(`   局域网访问: http://192.168.5.223:${PORT}`);
  console.log(`   后台管理:   http://192.168.5.223:${PORT}/#admin`);
  console.log('');
});
