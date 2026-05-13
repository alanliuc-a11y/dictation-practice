/**
 * 批量生成语音文件
 * 使用腾讯云语音合成 API
 */

const fs = require('fs');
const path = require('path');
const tencentcloud = require("tencentcloud-sdk-nodejs");

// 导入腾讯云 TTS SDK
const TtsClient = tencentcloud.tts.v20190823.Client;

// 读取配置
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// 配置客户端
const clientConfig = {
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
};

const client = new TtsClient(clientConfig);

// 音频保存目录
const AUDIO_DIR = path.join(__dirname, 'public', 'audio');

// 确保目录存在
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// 读取数据库中的所有词语
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'data', 'app.db'));

/**
 * 获取所有需要生成语音的词语
 */
function getAllWords() {
  // 从基础词库获取
  const builtinWords = db.prepare(`
    SELECT DISTINCT json_extract(words.value, '$.text') as text,
           json_extract(words.value, '$.pinyin') as pinyin
    FROM builtin_vocab, json_each(words)
  `).all();

  // 从自定义词库获取
  const customWords = db.prepare(`
    SELECT DISTINCT json_extract(words.value, '$.text') as text,
           json_extract(words.value, '$.pinyin') as pinyin
    FROM custom_vocab, json_each(words)
  `).all();

  // 合并去重
  const allWords = [...builtinWords, ...customWords];
  const uniqueWords = new Map();
  allWords.forEach(w => {
    if (w.text && !uniqueWords.has(w.text)) {
      uniqueWords.set(w.text, w);
    }
  });

  return Array.from(uniqueWords.values());
}

/**
 * 生成单个词语的语音
 */
async function generateAudio(text, voiceType = 1001) {
  const params = {
    Text: text,
    VoiceType: voiceType,
    Codec: "mp3",
    SampleRate: 16000,
    Speed: 0,  // 语速，0为正常
    Volume: 0, // 音量，0为正常
  };

  try {
    const response = await client.TextToVoice(params);
    return response.Audio;
  } catch (error) {
    console.error(`生成失败 "${text}":`, error.message);
    return null;
  }
}

/**
 * 保存音频文件
 */
function saveAudioFile(text, audioBase64) {
  // 使用词语的 hash 作为文件名
  const fileName = Buffer.from(text).toString('base64').replace(/[+/=]/g, '_').substring(0, 32) + '.mp3';
  const filePath = path.join(AUDIO_DIR, fileName);

  const buffer = Buffer.from(audioBase64, 'base64');
  fs.writeFileSync(filePath, buffer);

  return fileName;
}

/**
 * 主函数：批量生成语音
 */
async function main() {
  console.log('=== 语音文件批量生成 ===\n');

  // 获取所有词语
  const words = getAllWords();
  console.log(`共找到 ${words.length} 个词语需要生成语音\n`);

  if (words.length === 0) {
    console.log('没有需要处理的词语');
    return;
  }

  // 记录已生成的
  const audioMap = {};
  let successCount = 0;
  let failCount = 0;

  // 批量生成
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const text = word.text;

    // 检查是否已存在
    const existingFile = path.join(AUDIO_DIR, Buffer.from(text).toString('base64').replace(/[+/=]/g, '_').substring(0, 32) + '.mp3');
    if (fs.existsSync(existingFile)) {
      console.log(`[${i + 1}/${words.length}] 已存在: ${text}`);
      audioMap[text] = path.basename(existingFile);
      successCount++;
      continue;
    }

    console.log(`[${i + 1}/${words.length}] 生成中: ${text}`);

    // 生成语音
    const audioBase64 = await generateAudio(text);

    if (audioBase64) {
      const fileName = saveAudioFile(text, audioBase64);
      audioMap[text] = fileName;
      successCount++;
      console.log(`  ✓ 保存成功: ${fileName}`);
    } else {
      failCount++;
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 保存映射表
  const mapPath = path.join(__dirname, 'data', 'audio_map.json');
  fs.writeFileSync(mapPath, JSON.stringify(audioMap, null, 2));

  console.log('\n=== 生成完成 ===');
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`音频目录: ${AUDIO_DIR}`);
  console.log(`映射文件: ${mapPath}`);
}

main().catch(console.error);
