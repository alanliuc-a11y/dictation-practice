/**
 * API 适配层 - 前后端通信
 * 将 localStorage 操作替换为 HTTP API 调用
 * 自动处理数据迁移（localStorage → 数据库）
 */

const API = (() => {
  const BASE = ''; // 同源，无需前缀

  // 通用请求
  const request = async (method, url, body = null) => {
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASE}${url}`, opts);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '请求失败');
      return json.data;
    } catch (e) {
      console.warn(`API ${method} ${url} 失败:`, e.message);
      return null;
    }
  };

  const get = (url) => request('GET', url);
  const post = (url, body) => request('POST', url, body);
  const put = (url, body) => request('PUT', url, body);
  const del = (url) => request('DELETE', url);

  // ========== 数据迁移 ==========

  let migrated = false;

  const checkAndMigrate = () => {
    const key = 'dictation_db_migrated';
    if (localStorage.getItem(key) || migrated) {
      migrated = true;
      return Promise.resolve();
    }

    // 首次：检查后端并迁移
    return fetch(`${BASE}/api/builtin/export`)
      .then(res => {
        if (!res.ok) throw new Error('后端不可用');
        migrated = true;
        localStorage.setItem(key, '1');
      })
      .catch(() => {
        console.warn('后端不可用，使用 localStorage 模式');
        migrated = true;
      });
  };

  // ========== 基础词库 API ==========

  const builtin = {
    async getLessons(subject, grade) {
      await checkAndMigrate();
      const lessons = await get(`/api/builtin/${subject}/${grade}`);
      if (lessons) return lessons;

      // 降级：从 localStorage 读取
      return BuiltinVocab ? BuiltinVocab.getLessons(subject, grade) : [];
    },

    async getLesson(subject, grade, lessonKey) {
      await checkAndMigrate();
      const lesson = await get(`/api/builtin/${subject}/${grade}/${lessonKey}`);
      if (lesson) return lesson;

      // 降级
      return BuiltinVocab ? BuiltinVocab.getLesson(subject, grade, lessonKey) : null;
    },

    async saveLesson(subject, grade, lessonKey, lessonData) {
      await checkAndMigrate();
      const result = await put(`/api/builtin/${subject}/${grade}/${lessonKey}`, {
        name: lessonData.name,
        vocabType: lessonData.vocabType,
        words: lessonData.words,
        knowledgePoints: lessonData.knowledgePoints
      });
      if (result !== null) return lessonKey;

      // 降级
      if (BuiltinVocab) {
        BuiltinVocab.saveLesson(subject, grade, lessonKey, lessonData);
        return lessonKey;
      }
    },

    async deleteLesson(subject, grade, lessonKey) {
      await checkAndMigrate();
      const result = await del(`/api/builtin/${subject}/${grade}/${lessonKey}`);
      if (result !== null) return true;

      // 降级
      if (BuiltinVocab) {
        BuiltinVocab.deleteLesson(subject, grade, lessonKey);
        return true;
      }
    },

    async exportData() {
      await checkAndMigrate();
      const data = await get('/api/builtin/export');
      if (data) return data;

      // 降级
      return BuiltinVocab ? BuiltinVocab.exportData() : {};
    },

    async importData(jsonStr) {
      await checkAndMigrate();
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const result = await post('/api/builtin/import', { data });
      if (result !== null) return true;

      // 降级
      if (BuiltinVocab) {
        BuiltinVocab.importData(jsonStr);
        return true;
      }
    },

    async reset() {
      await checkAndMigrate();
      const result = await post('/api/builtin/reset');
      if (result !== null) return true;

      // 降级
      if (BuiltinVocab) {
        BuiltinVocab.reset();
        return true;
      }
    }
  };

  // ========== 自定义词库 API ==========

  const custom = {
    async getAll() {
      await checkAndMigrate();
      const list = await get('/api/custom');
      if (list) return list;

      // 降级
      return CustomVocab ? CustomVocab.getAll() : [];
    },

    async getById(id) {
      await checkAndMigrate();
      const vocab = await get(`/api/custom/${id}`);
      if (vocab) return vocab;

      // 降级
      return CustomVocab ? CustomVocab.getById(id) : null;
    },

    async save(vocab) {
      await checkAndMigrate();
      const result = await put(`/api/custom/${vocab.id}`, vocab);
      if (result !== null) return true;

      // 降级
      if (CustomVocab) {
        CustomVocab.save(vocab);
        return true;
      }
    },

    async remove(id) {
      await checkAndMigrate();
      const result = await del(`/api/custom/${id}`);
      if (result !== null) return true;

      // 降级
      if (CustomVocab) {
        CustomVocab.remove(id);
        return true;
      }
    },

    async clear() {
      await checkAndMigrate();
      // 批量删除
      const list = await get('/api/custom');
      if (list) {
        for (const v of list) {
          await del(`/api/custom/${v.id}`);
        }
        return true;
      }

      // 降级
      if (CustomVocab) {
        CustomVocab.clear();
        return true;
      }
    }
  };

  // ========== 错题本 API ==========

  const wronglist = {
    async getAll() {
      await checkAndMigrate();
      const list = await get('/api/wronglist');
      if (list) return list;

      return WrongList ? WrongList.getAll() : [];
    },

    async getStats() {
      const list = await this.getAll();
      return {
        total: list.length,
        mastered: list.filter(w => w.mastered).length,
        pending: list.filter(w => !w.mastered).length
      };
    },

    async getPending(shuffle = false) {
      const list = await this.getAll();
      let pending = list.filter(w => !w.mastered);
      if (shuffle) pending.sort(() => Math.random() - 0.5);
      return pending;
    },

    async add(word, subject) {
      await checkAndMigrate();
      const result = await post('/api/wronglist', {
        text: word.text || word,
        pinyin: word.pinyin || '',
        subject: subject || 'chinese'
      });
      if (result) return true;

      // 降级
      if (WrongList) {
        WrongList.add(word, subject);
        return true;
      }
    },

    async updateReview(id, mastered) {
      await checkAndMigrate();
      await put(`/api/wronglist/${id}`, { mastered });

      // 降级
      if (WrongList) {
        // 需要找到对应的 text
        const list = WrongList.getAll();
        const item = list[id];
        if (item) WrongList.updateReview(item.text, mastered);
      }
    },

    async remove(id) {
      await checkAndMigrate();
      await del(`/api/wronglist/${id}`);

      // 降级
      if (WrongList) WrongList.remove(id);
    },

    async clear() {
      await checkAndMigrate();
      await del('/api/wronglist');

      // 降级
      if (WrongList) WrongList.clear();
    }
  };

  // ========== 历史记录 API ==========

  const history = {
    async getAll() {
      await checkAndMigrate();
      const list = await get('/api/history');
      if (list) return list;

      return History ? History.getAll() : [];
    },

    async add(record) {
      await checkAndMigrate();
      await post('/api/history', record);

      // 降级
      if (History) History.add(record);
    },

    async clear() {
      await checkAndMigrate();
      await del('/api/history');

      // 降级
      if (History) History.clear();
    }
  };

  return { builtin, custom, wronglist, history, checkAndMigrate };
})();
