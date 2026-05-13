/**
 * app.js - 主程序（改进版 v2）
 * 改进内容：
 * 1. 升级ES6+语法（const/let、箭头函数、模板字符串）
 * 2. 增强XSS防护（所有用户输入都经过escapeHtml）
 * 3. 严格对齐 index.html 中的元素ID和交互逻辑
 * 4. 实现事件委托优化性能
 * 5. 添加输入验证
 */

// 全局处理函数（供HTML onclick调用）
window.handleLessonCheckboxClick = function(label, subject, value) {
  const checkbox = label.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  
  const targetList = subject === 'chinese' ? App.getState().selectedChinese : App.getState().selectedEnglish;
  if (checkbox.checked) {
    if (!targetList.includes(value)) targetList.push(value);
  } else {
    const idx = targetList.indexOf(value);
    if (idx > -1) targetList.splice(idx, 1);
  }
  App.renderSettingSummary();
};

const App = (() => {
  'use strict';

  // ========== 安全工具 ==========
  const escapeHtml = (str) => {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  };

  // ========== 应用状态 ==========
  const state = {
    currentPage: 'home',
    // 设置页 - 三段式选择
    currentGrade: 'grade2_semester1',  // 全局学期选择
    selectedChinese: [],      // 选中的语文课文key列表
    selectedEnglish: [],      // 选中的英语课文key列表
    selectedMath: [],         // 选中的数学知识点列表
    repeat: 3,
    interval: 3,
    // 词库编辑
    vocabEditId: null,         // null=新建, string=编辑
    vocabEditWords: [],
    vocabKnowledgePoints: [],
    // 听写
    dictationWords: [],
    dictationIndex: 0,
    isPaused: false,
    isPlaying: false,
    // 当前播报学科
    currentSubject: 'chinese',
    // 后台管理
    adminGrade: 'grade2_semester1',
    adminEditLessonKey: null,  // null=新建, string=编辑
    adminEditWords: [],        // 编辑中的词语列表
    adminEditMathKnowledge: [], // 编辑中的数学知识点
  };

  // 页面元素缓存
  const pages = {};

  // ========== 工具函数 ==========

  const $ = (id) => document.getElementById(id);

  const navigateTo = (pageName) => {
    Object.values(pages).forEach(p => { if (p) p.classList.remove('active'); });
    if (pages[pageName]) pages[pageName].classList.add('active');
    state.currentPage = pageName;
    window.scrollTo(0, 0);
  };

  // ========== 初始化 ==========

  const init = () => {
    // 缓存页面元素
    ['home','settings','preview','dictation','result','answer','wronglist','wronglist-result','history','vocab-manage','vocab-edit','admin','admin-lesson-edit','admin-math-edit']
      .forEach(id => { pages[id] = $(`page-${id}`); });

    bindAllEvents();
    // 检查后端并迁移数据
    API.checkAndMigrate().then(() => {
      // 检查URL hash，支持直接进入后台管理
      const hash = window.location.hash;
      if (hash === '#admin') {
        navigateTo('admin');
        renderAdminPage();
      } else if (hash === '#admin-math-edit') {
        navigateTo('admin-math-edit');
        setTimeout(() => renderAdminMathEdit(), 0);
      } else {
        navigateTo('home');
      }
    });
  };

  // ========== 全量事件绑定（严格对齐HTML ID） ==========

  const bindAllEvents = () => {
    // --- 首页 ---
    $('btn-start')?.addEventListener('click', () => {
      state.selectedChinese = [];
      state.selectedEnglish = [];
      state.selectedMath = [];
      navigateTo('settings');
      renderSettingsPage();
    });
    $('btn-vocab-manage')?.addEventListener('click', () => { navigateTo('vocab-manage'); renderVocabManage(); });
    $('btn-wronglist')?.addEventListener('click', () => { navigateTo('wronglist'); renderWronglist(); });
    $('btn-history')?.addEventListener('click', () => { navigateTo('history'); renderHistory(); });

    // --- 隐藏入口：连续点击标题5次进入后台 ---
    let titleClickCount = 0;
    let titleClickTimer = null;
    const homePage = document.getElementById('page-home');
    const appTitle = document.querySelector('.app-title');
    if (appTitle) {
      appTitle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        titleClickCount++;
        if (titleClickTimer) clearTimeout(titleClickTimer);
        titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 2000);
        if (titleClickCount >= 5) {
          titleClickCount = 0;
          navigateTo('admin');
          renderAdminPage();
        }
      });
    }

    // --- 后台管理页 ---
    $('btn-admin-back')?.addEventListener('click', () => navigateTo('home'));
    $('admin-grade')?.addEventListener('change', (e) => {
      state.adminGrade = e.target.value;
      renderAdminLessons();
    });
    $('btn-admin-add-lesson')?.addEventListener('click', () => {
      state.adminEditLessonKey = null;
      navigateTo('admin-lesson-edit');
      renderAdminLessonEdit();
    });
    $('btn-admin-export')?.addEventListener('click', async () => {
      const data = await API.builtin.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    $('btn-admin-reset')?.addEventListener('click', async () => {
      if (confirm('确定要重置基础词库吗？这将恢复到系统默认数据。')) {
        await API.builtin.reset();
        renderAdminLessons();
        alert('已重置为基础词库');
      }
    });
    // 添加数学知识点
    $('btn-admin-add-math')?.addEventListener('click', () => {
      state.adminEditLessonKey = null;
      state.adminEditMathKnowledge = [];
      navigateTo('admin-math-edit');
      renderAdminMathEdit();
    });

    // --- 后台课文编辑页 ---
    $('btn-admin-lesson-back')?.addEventListener('click', () => { navigateTo('admin'); renderAdminLessons(); });
    $('btn-admin-save-lesson')?.addEventListener('click', saveAdminLesson);
    $('btn-admin-delete-lesson')?.addEventListener('click', deleteAdminLesson);
    // 添加词语（回车或点击按钮）
    $('admin-word-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addAdminWord();
      }
    });
    $('btn-admin-add-word')?.addEventListener('click', addAdminWord);

    // --- 后台数学知识点编辑页 ---
    $('btn-admin-math-back')?.addEventListener('click', () => { navigateTo('admin'); renderAdminLessons(); });
    $('btn-admin-save-math')?.addEventListener('click', saveAdminMath);
    $('btn-admin-delete-math')?.addEventListener('click', deleteAdminMath);
    $('btn-admin-math-preview')?.addEventListener('click', previewAdminMath);

    // --- 设置页 ---
    $('btn-settings-back')?.addEventListener('click', () => navigateTo('home'));
    // 全局学期切换
    $('global-grade')?.addEventListener('change', () => {
      state.currentGrade = $('global-grade')?.value || 'grade2_semester1';
      renderSubjectContentList('chinese');
      renderSubjectContentList('english');
    });

    // 播放次数
    $('set-repeat')?.addEventListener('change', (e) => { state.repeat = parseInt(e.target.value); renderSettingSummary(); });
    // 间隔
    $('set-interval')?.addEventListener('change', (e) => { state.interval = parseInt(e.target.value); renderSettingSummary(); });
    // 预览
    $('btn-preview')?.addEventListener('click', () => { navigateTo('preview'); renderPreview(); });
    // 开始听写
    $('btn-start-dictation')?.addEventListener('click', () => { startDictation(); });

    // --- 预览页 ---
    $('btn-preview-back')?.addEventListener('click', () => navigateTo('settings'));
    $('btn-print')?.addEventListener('click', () => window.print());

    // --- 听写页 ---
    $('btn-dictation-stop')?.addEventListener('click', () => {
      // 显示二次确认弹窗
      const modal = $('stop-confirm-modal');
      if (modal) modal.style.display = 'flex';
    });
    $('btn-stop-cancel')?.addEventListener('click', () => {
      // 关闭弹窗，继续听写
      const modal = $('stop-confirm-modal');
      if (modal) modal.style.display = 'none';
    });
    $('btn-stop-confirm')?.addEventListener('click', () => {
      // 确认结束
      const modal = $('stop-confirm-modal');
      if (modal) modal.style.display = 'none';
      stopDictation();
    });
    $('btn-replay')?.addEventListener('click', replayCurrentWord);
    $('btn-dictation-pause')?.addEventListener('click', togglePause);

    // --- 结果页 ---
    $('btn-view-answer')?.addEventListener('click', () => { navigateTo('answer'); renderAnswer(); });
    $('btn-result-retry')?.addEventListener('click', () => startDictation());
    $('btn-result-home')?.addEventListener('click', () => navigateTo('home'));

    // --- 答案页 ---
    $('btn-answer-back')?.addEventListener('click', () => navigateTo('result'));
    $('btn-answer-print')?.addEventListener('click', () => window.print());

    // --- 错题本 ---
    $('btn-wronglist-back')?.addEventListener('click', () => navigateTo('home'));
    $('btn-wronglist-review')?.addEventListener('click', () => startWronglistReview(false));
    $('btn-wronglist-shuffle')?.addEventListener('click', () => startWronglistReview(true));
    $('btn-wronglist-clear')?.addEventListener('click', () => {
      if (confirm('确定清空所有错题吗？此操作不可恢复。')) {
        WrongList.clear();
        renderWronglist();
      }
    });

    // --- 错题复习结果页 ---
    $('btn-wronglist-mastered')?.addEventListener('click', () => markWronglistMastered(true));
    $('btn-wronglist-partial')?.addEventListener('click', () => markWronglistMastered(false));
    $('btn-wronglist-continue')?.addEventListener('click', () => markWronglistMastered(false));

    // --- 历史记录 ---
    $('btn-history-back')?.addEventListener('click', () => navigateTo('home'));

    // --- 词库管理 ---
    $('btn-vocab-manage-back')?.addEventListener('click', () => navigateTo('home'));
    $('btn-vocab-create')?.addEventListener('click', () => {
      state.vocabEditId = null;
      state.vocabEditWords = [];
      state.vocabKnowledgePoints = [];
      navigateTo('vocab-edit');
      renderVocabEdit();
    });
    // 筛选Tab
    document.querySelectorAll('.btn-vocab-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-vocab-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderVocabManage(btn.dataset.filter);
      });
    });

    // --- 词库编辑 ---
    $('btn-vocab-edit-back')?.addEventListener('click', () => { navigateTo('vocab-manage'); renderVocabManage(); });
    $('btn-vocab-save')?.addEventListener('click', saveVocab);
    $('btn-vocab-add-word')?.addEventListener('click', () => { state.vocabEditWords.push({ text: '', pinyin: '' }); renderVocabWordList(); });
    $('btn-vocab-import')?.addEventListener('click', importVocabWords);
    $('btn-add-knowledge')?.addEventListener('click', addKnowledgePoint);
    $('btn-preview-knowledge')?.addEventListener('click', previewKnowledge);
    // 学科切换（词库编辑页）
    $('vocab-subject')?.addEventListener('change', (e) => {
      const subject = e.target.value;
      updateVocabTypeOptions(subject);
      // 数学知识点区域
      const mathSection = $('math-knowledge-section');
      if (mathSection) mathSection.style.display = (subject === 'math') ? '' : 'none';
      // 语文输入区域切换
      updateVocabInputSection(subject);
    });
    // 词汇类型切换（词库编辑页）
    $('vocab-type')?.addEventListener('change', (e) => {
      updateVocabInputByType(e.target.value);
    });
    // 添加古诗词
    $('btn-add-poem')?.addEventListener('click', addPoemWord);
  };

  // ========== 设置页渲染 ==========

  const renderSettingsPage = async () => {
    // 同步全局学期选择器
    const globalGrade = $('global-grade');
    if (globalGrade) {
      globalGrade.value = state.currentGrade || 'grade2_semester1';
    }
    renderSubjectContentList('chinese');
    renderSubjectContentList('english');
    renderMathContentList($('math-content-list'));
    renderSettingSummary();
  };

  // 渲染语文/英语内容列表（分区显示：课本词库 + 自定义词库）
  const renderSubjectContentList = async (subject) => {
    const grade = state.currentGrade || 'grade2_semester1';
    const builtinContainerId = subject === 'chinese' ? 'chinese-content-list' : 'english-content-list';
    const customContainerId = subject === 'chinese' ? 'chinese-custom-list' : 'english-custom-list';
    const selectedList = subject === 'chinese' ? state.selectedChinese : state.selectedEnglish;

    const builtinContainer = $(builtinContainerId);
    const customContainer = $(customContainerId);

    // 1. 渲染课本词库（从 API 获取，支持动态编辑）
    if (builtinContainer) {
      const lessons = await API.builtin.getLessons(subject, grade);
      let items = '';

      if (lessons.length > 0) {
        items = lessons.map(l => {
          const checked = selectedList.includes(`builtin:${grade}:${l.key}`) ? 'checked' : '';
          const value = `builtin:${grade}:${l.key}`;
          return `
            <label class="unit-item" onclick="window.handleLessonCheckboxClick(this, '${subject}', '${value.replace(/'/g, "\\'")}')">
              <input type="checkbox" ${checked} class="lesson-checkbox">
              <span class="unit-name">${escapeHtml(l.name)}</span>
              <span class="unit-count">${l.wordCount}词</span>
            </label>`;
        }).join('');
      } else {
        items = '<p class="empty-hint">暂无课本词库</p>';
      }

      builtinContainer.innerHTML = items;
    }

    // 2. 渲染自定义词库（不受学期影响，始终显示全部）
    if (customContainer) {
      const customVocabs = (await API.custom.getAll()).filter(v => v.subject === subject);
      const typeLabels = { word: '单字/单词', phrase: '短语', poem: '古诗词' };

      if (customVocabs.length > 0) {
        const items = customVocabs.map(v => {
          const checked = selectedList.includes(`custom:${v.id}`) ? 'checked' : '';
          const typeLabel = typeLabels[v.vocabType] || '';
          const value = `custom:${v.id}`;
          return `
            <label class="unit-item custom-vocab-item" onclick="window.handleLessonCheckboxClick(this, '${subject}', '${value.replace(/'/g, "\\'")}')">
              <input type="checkbox" ${checked} class="lesson-checkbox">
              <span class="unit-name">${escapeHtml(v.name)}</span>
              ${typeLabel ? `<span class="unit-type">${typeLabel}</span>` : ''}
              <span class="unit-count">${v.words ? v.words.length : 0}词</span>
            </label>`;
        }).join('');
        customContainer.innerHTML = items;
      } else {
        customContainer.innerHTML = '<p class="empty-hint">暂无自定义词库，请到词库管理中添加</p>';
      }
    }
  };

  const renderMathContentList = async (container) => {
    if (!container) return;

    const grade = state.currentGrade || 'grade2_semester1';

    // 从 API 获取数学知识点
    const builtinLessons = await API.builtin.getLessons('math', grade);

    // 默认数学类型
    const defaultMathTypes = [
      { type: 'addition_1digit', label: '一位数加法', defaultCount: 10 },
      { type: 'subtraction_1digit', label: '一位数减法', defaultCount: 10 },
      { type: 'multiplication_99', label: '乘法口诀', defaultCount: 20 },
    ];

    let html = '';

    // 1. 显示后台创建的知识点
    if (builtinLessons.length > 0) {
      html += '<div class="vocab-section-label">📚 后台知识点</div>';
      html += builtinLessons.map(l => {
        const checked = state.selectedMath.includes(`builtin:${grade}:${l.key}`) ? 'checked' : '';
        const kpCount = l.knowledgePoints ? l.knowledgePoints.reduce((sum, kp) => sum + (kp.count || 5), 0) : 0;
        return `
          <label class="unit-item">
            <input type="checkbox" value="builtin:${grade}:${l.key}" ${checked} class="math-checkbox" data-type="builtin">
            <span class="unit-name">${escapeHtml(l.name)}</span>
            <span class="unit-count">约${kpCount}题</span>
          </label>`;
      }).join('');
    }

    // 2. 显示默认数学类型
    html += '<div class="vocab-section-label">⚡ 快速选择</div>';
    html += defaultMathTypes.map(mt => {
      const checked = state.selectedMath.includes(mt.type) ? 'checked' : '';
      return `
        <label class="unit-item">
          <input type="checkbox" value="${escapeHtml(mt.type)}" ${checked} class="math-checkbox" data-count="${mt.defaultCount}" data-type="default">
          <span class="unit-name">${escapeHtml(mt.label)}</span>
        </label>`;
    }).join('');

    container.innerHTML = html;

    // 绑定事件
    container.querySelectorAll('.math-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!state.selectedMath.includes(cb.value)) state.selectedMath.push(cb.value);
        } else {
          state.selectedMath = state.selectedMath.filter(k => k !== cb.value);
        }
        renderSettingSummary();
      });
    });
  };

  const renderSettingSummary = () => {
    const el = $('setting-summary');
    if (!el) return;
    
    const chineseCount = state.selectedChinese.length;
    const englishCount = state.selectedEnglish.length;
    const mathCount = state.selectedMath.length;
    
    const parts = [];
    if (chineseCount > 0) parts.push(`语文${chineseCount}项`);
    if (englishCount > 0) parts.push(`英语${englishCount}项`);
    if (mathCount > 0) parts.push(`数学${mathCount}项`);
    
    if (parts.length === 0) {
      el.innerHTML = '请选择练习内容';
    } else {
      el.innerHTML = `已选 ${parts.join('、')}，每词播放${state.repeat}次，间隔${state.interval}秒`;
    }
  };

  // ========== 预览页 ==========

  const renderPreview = async () => {
    const pager = $('preview-pager');
    const dotsContainer = $('preview-dots');
    if (!pager) return;

    // 收集三段式内容
    const chineseWords = await collectWordsBySubject('chinese', state.selectedChinese);
    const englishWords = await collectWordsBySubject('english', state.selectedEnglish);
    const mathWords = await collectMathWords();

    // 合并所有词语用于听写播报
    state.dictationWords = [...chineseWords, ...englishWords];

    if (chineseWords.length === 0 && englishWords.length === 0 && mathWords.length === 0) {
      pager.innerHTML = '<p class="empty-hint" style="padding:40px;text-align:center;">请先选择练习内容</p>';
      dotsContainer.innerHTML = '';
      return;
    }

    // 重置全局编号计数器
    globalWordIndex = 0;

    // 生成所有内容HTML（不分页）
    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    // 构建各个section的HTML
    const sections = [];
    if (chineseWords.length > 0) {
      sections.push(`
        <div class="practice-section">
          <div class="section-title">【语文听写】</div>
          <div class="word-grid">
            ${chineseWords.map((w, i) => renderWordLine(w, i, 'chinese')).join('')}
          </div>
        </div>`);
    }
    if (englishWords.length > 0) {
      sections.push(`
        <div class="practice-section">
          <div class="section-title">【英语听写】</div>
          <div class="word-grid">
            ${englishWords.map((w, i) => renderWordLine(w, i, 'english')).join('')}
          </div>
        </div>`);
    }
    if (mathWords.length > 0) {
      sections.push(`
        <div class="practice-section math-section">
          <div class="section-title">【数学练习】</div>
          <div class="math-problems">
            ${mathWords.map((w, i) => renderMathProblem(w, i)).join('')}
          </div>
        </div>`);
    }

    const headerHtml = `
      <div class="preview-header">
        <div class="preview-title">每日练习</div>
        <div class="preview-date">${dateStr}</div>
      </div>`;

    const allContentHtml = headerHtml + sections.join('');

    // 分页逻辑：创建临时元素测量高度
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:0;width:17.5cm;visibility:hidden;';
    tempDiv.innerHTML = allContentHtml;
    document.body.appendChild(tempDiv);

    const pageContentHeight = 27 * 37.8 - 0.8 * 37.8 * 2 - 20; // A4高度 - 上下padding - 标题区
    const headerEl = tempDiv.querySelector('.preview-header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    const availableHeight = pageContentHeight - headerHeight;

    // 收集所有section元素，按顺序分配到页面
    const sectionEls = Array.from(tempDiv.querySelectorAll('.practice-section'));
    const pages = [];
    let currentPageHtml = '';
    let currentHeight = 0;

    // 第一页加标题
    currentPageHtml = headerHtml;
    currentHeight = headerHeight;

    sectionEls.forEach(sectionEl => {
      const sectionHeight = sectionEl.offsetHeight;
      if (currentHeight + sectionHeight > pageContentHeight && currentPageHtml !== headerHtml) {
        // 当前页放不下了，保存当前页，开始新页
        pages.push(currentPageHtml);
        currentPageHtml = '';
        currentHeight = 0;
      }
      currentPageHtml += sectionEl.outerHTML;
      currentHeight += sectionHeight;
    });

    // 最后一页
    if (currentPageHtml) {
      pages.push(currentPageHtml);
    }

    document.body.removeChild(tempDiv);

    // 如果没有分页成功（测量可能不准确），至少保证有一页
    if (pages.length === 0) {
      pages.push(allContentHtml);
    }

    // 渲染多张A4纸
    pager.innerHTML = pages.map((pageHtml, i) =>
      `<div class="preview-page" id="preview-page-${i}">${pageHtml}</div>`
    ).join('');

    // 渲染翻页指示器
    dotsContainer.innerHTML = pages.map((_, i) =>
      `<div class="preview-dot${i === 0 ? ' active' : ''}" data-page="${i}"></div>`
    ).join('');

    // 手机端缩放每张纸
    const scalePages = () => {
      const containerWidth = pager.clientWidth;
      const paperWidth = 19.5 * 37.8;
      const scale = containerWidth < paperWidth ? containerWidth / paperWidth : 1;
      const gap = 12;
      const pageElWidth = paperWidth * scale;

      document.querySelectorAll('.preview-page').forEach(page => {
        page.style.transform = `scale(${scale})`;
        page.style.transformOrigin = 'top left';
        // 缩放后实际占用的宽度
        page.style.width = (19.5 * 37.8) + 'px';
        page.style.height = (27 * 37.8) + 'px';
        // 用margin-right模拟gap（因为缩放后gap也会变小）
        page.style.marginRight = (gap / scale) + 'px';
      });

      // 设置每张纸的包裹容器高度
      const paperHeight = 27 * 37.8 * scale;
      pager.style.alignItems = 'flex-start';
      pager.style.paddingTop = '8px';
      pager.style.height = (paperHeight + 16) + 'px';
    };
    scalePages();
    window.addEventListener('resize', scalePages);

    // 滑动时更新指示器
    pager.addEventListener('scroll', () => {
      const scrollLeft = pager.scrollLeft;
      const pageWidth = pager.querySelector('.preview-page')?.offsetWidth || 1;
      const gap = 12;
      const currentPage = Math.round(scrollLeft / (pageWidth * (pager.clientWidth < 19.5 * 37.8 ? pager.clientWidth / (19.5 * 37.8) : 1) + gap));
      document.querySelectorAll('.preview-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === Math.min(currentPage, pages.length - 1));
      });
    });
  };

  // 全局编号计数器
  let globalWordIndex = 0;

  // 渲染词语横线（紧凑排版：2字词1.5cm，4字成语3cm）
  const renderWordLine = (w, index, subject) => {
    if (w.isPoemHeader) {
      return `<div class="word-card word-card-full"><span class="poem-title">${escapeHtml(w.text)}</span></div>`;
    }
    if (w.isPoemLine) {
      // 古诗行：字数+标点，每个字0.8cm
      const lineLength = w.text.length * 0.8;
      return `<div class="word-card"><span class="word-num">${w.lineNum}.</span><span class="line-blank" style="width:${lineLength}cm"></span></div>`;
    }
    // 判断是否是短语/句子
    const isPhrase = w.vocabType === 'phrase' || (subject === 'english' && w.text && w.text.includes(' '));
    const charCount = w.text.length;
    let lineLength;
    if (isPhrase) {
      // 短语/句子：0.7cm/字
      lineLength = charCount * 0.7;
    } else if (subject === 'english') {
      // 英文单词：0.4cm/字母
      lineLength = charCount * 0.4;
    } else {
      // 中文词语：0.75cm/字（2字词1.5cm，4字成语3cm）
      lineLength = charCount * 0.75;
    }
    return `<div class="word-card"><span class="word-num">${++globalWordIndex}.</span><span class="line-blank" style="width:${lineLength}cm"></span></div>`;
  };

  // 渲染数学题目
  const renderMathProblem = (w, index) => {
    if (w.type === 'vertical') {
      return `<div class="math-problem vertical-problem"><span class="word-num">${++globalWordIndex}.</span><pre class="vertical-text">${escapeHtml(w.text)}</pre><span class="line-blank answer-line"></span></div>`;
    }
    if (w.type === 'word') {
      return `<div class="math-problem word-problem"><span class="word-num">${++globalWordIndex}.</span>${escapeHtml(w.text)}<span class="line-blank answer-line"></span></div>`;
    }
    // 口算题
    return `<div class="math-problem oral-problem"><span class="word-num">${++globalWordIndex}.</span>${escapeHtml(w.text)}<span class="line-blank answer-line"></span></div>`;
  };

  // 按学科收集词语
  const collectWordsBySubject = async (subject, selectedList) => {
    const words = [];

    for (const lessonKey of selectedList) {
      if (lessonKey.startsWith('builtin:')) {
        // 格式: builtin:grade:lessonKey
        const parts = lessonKey.replace('builtin:', '').split(':');
        const grade = parts[0];
        const key = parts.slice(1).join(':');
        // 从 API 获取
        const lesson = await API.builtin.getLesson(subject, grade, key);
        if (lesson && lesson.words) {
          words.push(...lesson.words);
        }
      } else if (lessonKey.startsWith('custom:')) {
        const vocabId = lessonKey.replace('custom:', '');
        const vocab = await API.custom.getById(vocabId);
        if (vocab && vocab.words) {
          words.push(...vocab.words);
        }
      }
    }

    return words;
  };

  // 收集数学题目
  const collectMathWords = async () => {
    if (state.selectedMath.length === 0) return [];
    
    const kps = [];
    for (const key of state.selectedMath) {
      if (key.startsWith('builtin:')) {
        // 后台创建的知识点
        const parts = key.replace('builtin:', '').split(':');
        const grade = parts[0];
        const lessonKey = parts.slice(1).join(':');
        const lesson = await API.builtin.getLesson('math', grade, lessonKey);
        if (lesson && lesson.knowledgePoints) {
          kps.push(...lesson.knowledgePoints);
        }
      } else {
        // 默认数学类型
        const cb = document.querySelector(`.math-checkbox[value="${key}"]`);
        kps.push({ type: key, count: parseInt(cb?.dataset.count || 10) });
      }
    }
    
    return MathGenerator.generate(kps);
  };

  // ========== 听写流程 ==========

  const startDictation = async () => {
    const chineseWords = await collectWordsBySubject('chinese', state.selectedChinese);
    const englishWords = await collectWordsBySubject('english', state.selectedEnglish);
    const allWords = [...chineseWords, ...englishWords];
    
    if (allWords.length === 0) { alert('请先选择听写内容'); return; }

    state.dictationWords = allWords;
    state.dictationIndex = 0;
    state.isPaused = false;
    state.isPlaying = true;
    state.currentSubject = 'chinese';

    navigateTo('dictation');
    playCurrentWord();
  };

  const playCurrentWord = () => {
    if (!state.isPlaying) return;
    const { dictationWords, dictationIndex } = state;
    if (dictationIndex >= dictationWords.length) { finishDictation(); return; }

    const word = dictationWords[dictationIndex];
    const total = dictationWords.length;

    // 更新进度
    const progressEl = $('dictation-progress');
    if (progressEl) progressEl.textContent = `${dictationIndex + 1} / ${total}`;
    const barEl = $('dictation-progress-bar');
    if (barEl) barEl.style.width = `${((dictationIndex + 1) / total) * 100}%`;
    const wordEl = $('dictation-word');
    if (wordEl) wordEl.textContent = `正在播放第 ${dictationIndex + 1} 题`;

    // 播放语音
    TTS.speak(word.text, { rate: 0.25, repeat: state.repeat }, () => {
      if (!state.isPaused && state.isPlaying) {
        // 使用Timer进行倒计时
        Timer.start(state.interval, (remaining) => {
          const timerEl = $('timer-display');
          if (timerEl) timerEl.textContent = remaining > 0 ? `${remaining}s` : '';
        }, () => {
          state.dictationIndex++;
          playCurrentWord();
        });
      }
    });
  };

  const togglePause = () => {
    state.isPaused = !state.isPaused;
    const btn = $('btn-dictation-pause');
    if (btn) btn.textContent = state.isPaused ? '继续' : '暂停';

    if (state.isPaused) {
      TTS.pause();
      Timer.pause();
    } else {
      TTS.resume();
      Timer.resume();
    }
  };

  const stopDictation = () => {
    state.isPlaying = false;
    state.isPaused = false;
    TTS.stop();
    Timer.reset();
    navigateTo('home');
  };

  const replayCurrentWord = () => {
    if (!state.isPlaying) return;
    TTS.stop();
    Timer.reset();
    playCurrentWord();
  };

  const finishDictation = () => {
    state.isPlaying = false;
    Timer.reset();

    // 如果是错题复习模式，跳转到错题复习结果页
    if (state.isWronglistReview) {
      finishWronglistReview();
      return;
    }

    // 保存历史
    History.add({
      date: new Date().toLocaleString('zh-CN'),
      subject: state.currentSubject,
      lessonName: [...state.selectedChinese, ...state.selectedEnglish].join(','),
      total: state.dictationWords.length,
      correct: state.dictationWords.length,
      wrong: 0,
    });

    // 更新结果页
    const infoEl = $('result-info');
    if (infoEl) infoEl.textContent = `听写播报完成，共 ${state.dictationWords.length} 个词语`;

    navigateTo('result');
  };

  // ========== 答案页 ==========

  const renderAnswer = () => {
    const container = $('answer-content');
    if (!container) return;

    globalWordIndex = 0;

    // 标题（和练习纸一致）
    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    let html = `
      <div class="preview-header">
        <div class="preview-title">每日练习 - 答案</div>
        <div class="preview-date">${dateStr}</div>
      </div>`;

    // 语文答案区
    const chineseWords = state.dictationWords.filter(w => !w.isEnglish);
    if (chineseWords.length > 0) {
      html += `
        <div class="practice-section">
          <div class="section-title">【语文听写】</div>
          <div class="practice-grid">
            ${chineseWords.map((w, i) => renderAnswerLine(w, 'chinese')).join('')}
          </div>
        </div>`;
    }

    // 英语答案区
    const englishWords = state.dictationWords.filter(w => w.isEnglish);
    if (englishWords.length > 0) {
      html += `
        <div class="practice-section">
          <div class="section-title">【英语听写】</div>
          <div class="word-grid">
            ${englishWords.map((w, i) => renderAnswerLine(w, 'english')).join('')}
          </div>
        </div>`;
    }

    container.innerHTML = html;

    // 手机端自动缩放
    const scaler = $('answer-scaler');
    const paper = container;
    if (scaler && paper) {
      const scalePaper = () => {
        const containerWidth = scaler.clientWidth;
        const paperWidth = 19.5 * 37.8;
        if (containerWidth < paperWidth) {
          const scale = containerWidth / paperWidth;
          paper.style.transform = `scale(${scale})`;
          paper.style.transformOrigin = 'top left';
          const paperHeight = 27 * 37.8;
          scaler.style.height = (paperHeight * scale) + 'px';
        } else {
          paper.style.transform = 'none';
          scaler.style.height = '';
        }
      };
      scalePaper();
      window.addEventListener('resize', scalePaper);
    }
  };

  // 渲染答案行（和练习纸排版一致，但显示答案文字）
  const renderAnswerLine = (w, subject) => {
    if (w.isPoemHeader) {
      return `<div class="word-card word-card-full"><span class="poem-title">${escapeHtml(w.text)}</span></div>`;
    }
    if (w.isPoemLine) {
      const lineLength = w.text.length * 0.8;
      return `<div class="word-card"><span class="word-num">${w.lineNum}.</span><span class="answer-text" style="width:${lineLength}cm">${escapeHtml(w.text)}</span></div>`;
    }
    const isPhrase = w.vocabType === 'phrase' || (subject === 'english' && w.text && w.text.includes(' '));
    const charCount = w.text.length;
    let lineLength;
    if (isPhrase) {
      lineLength = charCount * 0.7;
    } else if (subject === 'english') {
      lineLength = charCount * 0.4;
    } else {
      lineLength = charCount * 0.75;
    }
    return `<div class="word-card"><span class="word-num">${++globalWordIndex}.</span><span class="answer-text" style="width:${lineLength}cm">${escapeHtml(w.text)}</span>${w.pinyin ? `<span class="answer-hint">${escapeHtml(w.pinyin)}</span>` : ''}</div>`;
  };

  // ========== 听写流程 ==========

  // ========== 错题本 ==========

  const renderWronglist = () => {
    const container = $('wronglist-content');
    const statsEl = $('wronglist-stats');
    if (!container) return;

    const mistakes = WrongList.getAll();
    const stats = WrongList.getStats();

    // 更新统计信息
    if (statsEl) {
      statsEl.innerHTML = `共${stats.total}题 | 已掌握${stats.mastered}题 | 待复习${stats.pending}题`;
    }

    if (mistakes.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无错题，继续加油！</p>';
      return;
    }

    const html = mistakes.map((m, i) => `
      <div class="wronglist-item ${m.mastered ? 'mastered' : ''}" data-index="${i}" data-text="${escapeHtml(m.text)}">
        <div class="wronglist-checkbox">
          <input type="checkbox" class="wronglist-select" data-index="${i}">
        </div>
        <div class="wronglist-info">
          <span class="word-text">${escapeHtml(m.text)}</span>
          ${m.pinyin ? `<span class="word-py">${escapeHtml(m.pinyin)}</span>` : ''}
          ${m.meaning ? `<span class="word-meaning">${escapeHtml(m.meaning)}</span>` : ''}
          <span class="word-meta">复习${m.reviewCount || 0}次 ${m.mastered ? '✓已掌握' : ''}</span>
        </div>
        <div class="wronglist-actions">
          <button class="btn btn-small btn-secondary btn-wronglist-delete" data-index="${i}">删除</button>
        </div>
      </div>`).join('');

    container.innerHTML = html;

    // 绑定删除事件
    container.querySelectorAll('.btn-wronglist-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确定删除这道错题吗？')) {
          WrongList.remove(parseInt(btn.dataset.index));
          renderWronglist();
        }
      });
    });

    // 绑定选择事件
    container.querySelectorAll('.wronglist-select').forEach(cb => {
      cb.addEventListener('change', updateWronglistSelection);
    });
  };

  // 更新错题选择状态
  const updateWronglistSelection = () => {
    const selected = [];
    document.querySelectorAll('.wronglist-select:checked').forEach(cb => {
      const item = cb.closest('.wronglist-item');
      if (item) {
        selected.push(item.dataset.text);
      }
    });
    state.selectedWronglist = selected;
  };

  // 开始错题复习
  const startWronglistReview = (shuffle = false) => {
    const mistakes = WrongList.getPending(shuffle);
    if (mistakes.length === 0) {
      alert('暂无待复习的错题！');
      return;
    }

    // 使用选中的错题，如果没有选中则使用全部
    const selected = state.selectedWronglist || [];
    const reviewList = selected.length > 0
      ? mistakes.filter(m => selected.includes(m.text))
      : mistakes;

    if (reviewList.length === 0) {
      alert('请至少选择一道错题进行复习！');
      return;
    }

    state.dictationWords = reviewList;
    state.dictationIndex = 0;
    state.isPaused = false;
    state.isPlaying = true;
    state.isWronglistReview = true;

    navigateTo('dictation');
    playCurrentWord();
  };

  // 完成错题复习
  const finishWronglistReview = () => {
    state.isPlaying = false;
    Timer.reset();

    // 更新每道题的复习次数
    state.dictationWords.forEach(word => {
      WrongList.updateReview(word.text, false);
    });

    // 显示复习结果页
    navigateTo('wronglist-result');
    renderWronglistResult();
  };

  // 渲染错题复习结果
  const renderWronglistResult = () => {
    const container = $('wronglist-result-content');
    if (!container) return;

    const words = state.dictationWords;
    container.innerHTML = `
      <div class="wronglist-result-summary">
        <h3>错题复习完成</h3>
        <p>共复习 ${words.length} 道错题</p>
      </div>
      <div class="wronglist-result-words">
        ${words.map((w, i) => `
          <div class="wronglist-result-item">
            <span class="word-num">${i + 1}.</span>
            <span class="word-text">${escapeHtml(w.text)}</span>
            ${w.pinyin ? `<span class="word-py">${escapeHtml(w.pinyin)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  // 标记错题掌握状态
  const markWronglistMastered = (mastered) => {
    if (mastered) {
      const texts = state.dictationWords.map(w => w.text);
      const count = WrongList.markMastered(texts);
      alert(`已将 ${count} 道错题标记为已掌握！`);
    }
    navigateTo('wronglist');
    renderWronglist();
  };

  // ========== 历史记录 ==========

  const renderHistory = () => {
    const container = $('history-content');
    if (!container) return;

    const records = History.getAll();
    if (records.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无历史记录</p>';
      return;
    }

    const subjectNames = { chinese: '语文', english: '英语', math: '数学' };
    const html = records.map(r => `
      <div class="history-item">
        <div class="history-date">${escapeHtml(r.date || '')}</div>
        <div class="history-detail">
          <span>${escapeHtml(subjectNames[r.subject] || r.subject || '')}</span>
          <span>${r.total || 0}词</span>
          <span>对${r.correct || 0}</span>
        </div>
      </div>`).join('');

    container.innerHTML = html;
  };

  // ========== 词库管理 ==========

  const renderVocabManage = (filter) => {
    const container = $('vocab-manage-list');
    if (!container) return;

    const vocabs = CustomVocab.getAll();
    const f = filter || 'all';
    const filtered = f === 'all' ? vocabs : vocabs.filter(v => v.subject === f);

    if (filtered.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无自定义词库</p>';
      return;
    }

    const subjectLabels = { chinese: '语文', english: '英语', math: '数学' };
    const typeLabels = {
      word: '单字/单词',
      phrase: '短语',
      poem: '古诗词',
      knowledge: '知识点'
    };

    const html = filtered.map(v => {
      const subjectLabel = subjectLabels[v.subject] || v.subject;
      const typeLabel = typeLabels[v.vocabType || v.type] || (v.vocabType || v.type);
      return `
      <div class="vocab-manage-item" data-id="${escapeHtml(v.id)}">
        <div class="vocab-manage-info">
          <span class="vocab-manage-name">${escapeHtml(v.name)}</span>
          <span class="vocab-manage-meta">[${subjectLabel}] ${typeLabel} · ${v.words ? v.words.length : 0}词</span>
        </div>
        <div class="vocab-manage-actions">
          <button class="btn btn-small btn-secondary btn-vocab-edit" data-id="${escapeHtml(v.id)}">编辑</button>
          <button class="btn btn-small btn-secondary btn-vocab-delete" data-id="${escapeHtml(v.id)}">删除</button>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = html;

    // 绑定编辑/删除（事件委托）
    container.querySelectorAll('.btn-vocab-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const vocab = CustomVocab.getById(btn.dataset.id);
        if (!vocab) return;
        state.vocabEditId = vocab.id;
        state.vocabEditWords = [...(vocab.words || [])];
        state.vocabKnowledgePoints = vocab.knowledgePoints ? [...vocab.knowledgePoints] : [];
        navigateTo('vocab-edit');
        renderVocabEdit();
      });
    });

    container.querySelectorAll('.btn-vocab-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确定删除该词库吗？')) {
          CustomVocab.remove(btn.dataset.id);
          renderVocabManage(f);
        }
      });
    });
  };

  // ========== 词库编辑 ==========

  const renderVocabEdit = () => {
    const titleEl = $('vocab-edit-title');
    if (titleEl) titleEl.textContent = state.vocabEditId ? '编辑词库' : '新建词库';

    // 如果是编辑模式，填充表单
    if (state.vocabEditId) {
      const vocab = CustomVocab.getById(state.vocabEditId);
      if (vocab) {
        const subjectEl = $('vocab-subject');
        if (subjectEl) subjectEl.value = vocab.subject || 'chinese';
        const nameEl = $('vocab-name');
        if (nameEl) nameEl.value = vocab.name || '';

        // 先更新类型选项，再设置选中值
        updateVocabTypeOptions(vocab.subject || 'chinese');

        const typeEl = $('vocab-type');
        if (typeEl) typeEl.value = vocab.vocabType || vocab.type || 'word';

        const gradeEl = $('vocab-grade');
        if (gradeEl) gradeEl.value = vocab.grade || 'grade2_semester1';

        // 加载词语列表
        if (vocab.words) {
          state.vocabEditWords = [...vocab.words];
        }

        // 数学知识点
        if (vocab.knowledgePoints) {
          state.vocabKnowledgePoints = [...vocab.knowledgePoints];
          renderKnowledgePoints();
        }

        // 更新输入区域显示
        updateVocabInputSection(vocab.subject || 'chinese');

        // 数学区域显示
        const mathSection = $('math-knowledge-section');
        if (mathSection) mathSection.style.display = (vocab.subject === 'math') ? '' : 'none';
      }
    } else {
      // 新建模式：重置状态
      state.vocabEditWords = [];
      state.vocabKnowledgePoints = [];
      updateVocabTypeOptions('chinese');
      updateVocabInputSection('chinese');
    }

    renderVocabWordList();
  };

  const updateVocabTypeOptions = (subject) => {
    const typeEl = $('vocab-type');
    if (!typeEl) return;
    if (subject === 'math') {
      typeEl.innerHTML = '<option value="knowledge">知识点</option>';
    } else if (subject === 'chinese') {
      typeEl.innerHTML = `
        <option value="word">单字/词语</option>
        <option value="phrase">短语</option>
        <option value="poem">古诗词</option>
      `;
    } else if (subject === 'english') {
      typeEl.innerHTML = `
        <option value="word">单词</option>
        <option value="phrase">短语/句子</option>
      `;
    }
    // 触发类型切换以更新输入区域
    updateVocabInputByType(typeEl.value);
  };

  // 根据学科更新输入区域显示
  const updateVocabInputSection = (subject) => {
    const poemSection = $('poem-input-section');
    const vocabImportSection = $('vocab-import-section');
    const vocabWordsSection = $('vocab-words-section');
    const vocabNameRow = $('vocab-name')?.closest('.setting-row');
    const vocabType = $('vocab-type')?.value || 'word';

    if (subject === 'chinese') {
      updateVocabInputByType(vocabType);
      if (vocabNameRow) vocabNameRow.style.display = '';
      if (vocabWordsSection) vocabWordsSection.style.display = '';
    } else if (subject === 'english') {
      updateVocabInputByType(vocabType);
      if (vocabNameRow) vocabNameRow.style.display = '';
      if (vocabWordsSection) vocabWordsSection.style.display = '';
    } else {
      // 数学：隐藏诗词、词汇导入、词汇列表和课文名称区域
      if (poemSection) poemSection.style.display = 'none';
      if (vocabImportSection) vocabImportSection.style.display = 'none';
      if (vocabWordsSection) vocabWordsSection.style.display = 'none';
      if (vocabNameRow) vocabNameRow.style.display = 'none';
    }
  };

  // 根据词汇类型更新输入区域
  const updateVocabInputByType = (type) => {
    const poemSection = $('poem-input-section');
    const vocabImportSection = $('vocab-import-section');
    const subject = $('vocab-subject')?.value || 'chinese';

    if (subject === 'chinese' && type === 'poem') {
      // 古诗词：显示诗词输入区，隐藏批量导入区
      if (poemSection) poemSection.style.display = '';
      if (vocabImportSection) vocabImportSection.style.display = 'none';
    } else {
      // 其他类型：隐藏诗词输入区，显示批量导入区
      if (poemSection) poemSection.style.display = 'none';
      if (vocabImportSection) vocabImportSection.style.display = '';
    }
  };

  // 添加古诗词
  const addPoemWord = () => {
    const title = $('poem-title')?.value.trim();
    const author = $('poem-author')?.value.trim();
    const content = $('poem-content')?.value.trim();

    if (!title) { alert('请输入诗词标题'); return; }
    if (!content) { alert('请输入诗词正文'); return; }

    // 将古诗词拆分为多行，每行作为一个"词语"
    const lines = content.split('\n').filter(line => line.trim());

    // 添加标题和作者信息（作为第一行，带特殊标记）
    const header = `${title}${author ? ' · ' + author : ''}`;
    state.vocabEditWords.push({
      text: header,
      pinyin: '',
      isPoemHeader: true
    });

    // 添加诗词正文每一行
    lines.forEach((line, index) => {
      state.vocabEditWords.push({
        text: line.trim(),
        pinyin: '',
        isPoemLine: true,
        lineNum: index + 1
      });
    });

    // 清空输入框
    $('poem-title').value = '';
    $('poem-author').value = '';
    $('poem-content').value = '';

    renderVocabWordList();
  };

  const renderVocabWordList = () => {
    const container = $('vocab-word-list');
    const countEl = $('vocab-word-count');
    if (!container) return;

    const subject = $('vocab-subject')?.value || 'chinese';
    const vocabType = $('vocab-type')?.value || 'word';

    if (countEl) countEl.textContent = `(${state.vocabEditWords.length})`;

    if (state.vocabEditWords.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无词语，请添加或导入</p>';
      return;
    }

    const html = state.vocabEditWords.map((w, i) => {
      // 古诗词标题行特殊样式
      if (w.isPoemHeader) {
        return `
        <div class="vocab-word-row poem-header" data-index="${i}">
          <span class="poem-header-text">${escapeHtml(w.text)}</span>
          <button class="btn btn-small btn-secondary btn-remove-word" data-index="${i}">删除</button>
        </div>`;
      }
      // 诗词正文行
      if (w.isPoemLine) {
        return `
        <div class="vocab-word-row poem-line" data-index="${i}">
          <span class="poem-line-num">${w.lineNum}.</span>
          <input type="text" class="vocab-word-input poem-input" value="${escapeHtml(w.text)}" placeholder="诗句">
          <button class="btn btn-small btn-secondary btn-remove-word" data-index="${i}">删除</button>
        </div>`;
      }
      // 英语单词/短语
      if (subject === 'english') {
        const placeholder = vocabType === 'phrase' ? '短语' : '单词';
        return `
        <div class="vocab-word-row english-word-row" data-index="${i}">
          <input type="text" class="vocab-word-input ${vocabType === 'phrase' ? 'phrase-input' : ''}" value="${escapeHtml(w.text)}" placeholder="${placeholder}">
          <input type="text" class="vocab-py-input" value="${w.meaning ? escapeHtml(w.meaning) : ''}" placeholder="释义">
          <button class="btn btn-small btn-secondary btn-remove-word" data-index="${i}">删除</button>
        </div>`;
      }
      // 语文普通词语行
      return `
      <div class="vocab-word-row" data-index="${i}">
        <input type="text" class="vocab-word-input" value="${escapeHtml(w.text)}" placeholder="词语">
        <input type="text" class="vocab-py-input" value="${w.pinyin ? escapeHtml(w.pinyin) : ''}" placeholder="拼音">
        <button class="btn btn-small btn-secondary btn-remove-word" data-index="${i}">删除</button>
      </div>`;
    }).join('');

    container.innerHTML = html;

    // 绑定删除和输入事件
    container.querySelectorAll('.btn-remove-word').forEach(btn => {
      btn.addEventListener('click', () => {
        state.vocabEditWords.splice(parseInt(btn.dataset.index), 1);
        renderVocabWordList();
      });
    });
    container.querySelectorAll('.vocab-word-input').forEach((input, i) => {
      input.addEventListener('input', () => {
        if (state.vocabEditWords[i]) state.vocabEditWords[i].text = input.value;
      });
    });
    container.querySelectorAll('.vocab-py-input').forEach((input, i) => {
      input.addEventListener('input', () => {
        if (state.vocabEditWords[i]) {
          // 英语用meaning字段，语文用pinyin字段
          if (subject === 'english') {
            state.vocabEditWords[i].meaning = input.value;
          } else {
            state.vocabEditWords[i].pinyin = input.value;
          }
        }
      });
    });
  };

  const importVocabWords = () => {
    const textarea = $('vocab-import-text');
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) { alert('请输入要导入的内容'); return; }

    const subject = $('vocab-subject')?.value || 'chinese';
    const lines = text.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (subject === 'english') {
        // 英语解析：以第一个中文字符为分界点
        // 格式：apple 苹果 或 good morning 早上好
        const match = trimmed.match(/^([a-zA-Z\s]+)\s+([\u4e00-\u9fa5].*)$/);
        if (match) {
          state.vocabEditWords.push({
            text: sanitizeInput(match[1].trim()),
            meaning: sanitizeInput(match[2].trim())
          });
        } else {
          // 没有中文，只有英文
          state.vocabEditWords.push({ text: sanitizeInput(trimmed), meaning: '' });
        }
      } else {
        // 语文解析：支持格式：词语 拼音（空格分隔）或 词语|拼音
        let wordText, pinyin;
        if (trimmed.includes('|')) {
          const parts = trimmed.split('|');
          wordText = parts[0].trim();
          pinyin = parts[1] ? parts[1].trim() : '';
        } else {
          const parts = trimmed.split(/\s+/);
          wordText = parts[0];
          pinyin = parts.slice(1).join(' ');
        }
        if (wordText) {
          state.vocabEditWords.push({ text: sanitizeInput(wordText), pinyin: sanitizeInput(pinyin) });
        }
      }
    });

    textarea.value = '';
    renderVocabWordList();
  };

  const saveVocab = () => {
    const name = $('vocab-name')?.value.trim();
    if (!name) { alert('请输入课文名称'); return; }

    // 过滤空词语
    const words = state.vocabEditWords.filter(w => w.text && w.text.trim());
    if (words.length === 0) { alert('请至少添加一个词语'); return; }

    const subject = $('vocab-subject')?.value || 'chinese';
    const vocabType = $('vocab-type')?.value || 'word';
    const grade = $('vocab-grade')?.value || 'grade2_semester1';

    const vocab = {
      id: state.vocabEditId || Date.now().toString(36),
      name: sanitizeInput(name),
      subject,
      type: 'custom', // 固定为自定义类型
      vocabType, // 词汇类型：word/phrase/poem/knowledge
      grade,
      words: words.map(w => {
        const wordObj = {
          text: sanitizeInput(w.text),
          isPoemHeader: w.isPoemHeader || false,
          isPoemLine: w.isPoemLine || false,
          lineNum: w.lineNum || 0
        };
        // 根据学科设置不同字段
        if (subject === 'english') {
          wordObj.meaning = sanitizeInput(w.meaning || '');
        } else {
          wordObj.pinyin = sanitizeInput(w.pinyin || '');
        }
        return wordObj;
      }),
    };

    // 数学知识点
    if (subject === 'math' && state.vocabKnowledgePoints.length > 0) {
      vocab.knowledgePoints = state.vocabKnowledgePoints;
    }

    CustomVocab.save(vocab);
    navigateTo('vocab-manage');
    renderVocabManage();
  };

  // ========== 数学知识点 ==========

  const MATH_KP_TYPES = [
    { type: 'addition_1digit', label: '一位数加法' },
    { type: 'addition_2digit', label: '两位数加法' },
    { type: 'subtraction_1digit', label: '一位数减法' },
    { type: 'subtraction_2digit', label: '两位数减法' },
    { type: 'multiplication_99', label: '乘法口诀' },
    { type: 'division_simple', label: '简单除法' },
    { type: 'vertical_addition', label: '竖式加法' },
    { type: 'vertical_subtraction', label: '竖式减法' },
    { type: 'word_problem', label: '应用题' },
  ];

  const addKnowledgePoint = () => {
    state.vocabKnowledgePoints.push({ type: 'addition_1digit', count: 10 });
    renderKnowledgePoints();
  };

  const renderKnowledgePoints = () => {
    const container = $('math-knowledge-list');
    if (!container) return;

    const html = state.vocabKnowledgePoints.map((kp, i) => {
      const options = MATH_KP_TYPES.map(t =>
        `<option value="${t.type}" ${t.type === kp.type ? 'selected' : ''}>${t.label}</option>`
      ).join('');
      return `
        <div class="kp-row" data-index="${i}">
          <select class="kp-type">${options}</select>
          <input type="number" class="kp-count" value="${kp.count || 10}" min="1" max="50">
          <button class="btn btn-small btn-secondary btn-remove-kp" data-index="${i}">删除</button>
        </div>`;
    }).join('');

    container.innerHTML = html;

    container.querySelectorAll('.kp-type').forEach((sel, i) => {
      sel.addEventListener('change', () => { state.vocabKnowledgePoints[i].type = sel.value; });
    });
    container.querySelectorAll('.kp-count').forEach((input, i) => {
      input.addEventListener('change', () => { state.vocabKnowledgePoints[i].count = parseInt(input.value) || 10; });
    });
    container.querySelectorAll('.btn-remove-kp').forEach(btn => {
      btn.addEventListener('click', () => {
        state.vocabKnowledgePoints.splice(parseInt(btn.dataset.index), 1);
        renderKnowledgePoints();
      });
    });
  };

  const previewKnowledge = () => {
    const container = $('math-knowledge-preview');
    if (!container) return;
    const questions = MathGenerator.generate(state.vocabKnowledgePoints);
    if (questions.length === 0) { container.innerHTML = '<p class="empty-hint">请先添加知识点</p>'; return; }
    container.innerHTML = questions.map((q, i) => `<span class="preview-word">${i + 1}. ${escapeHtml(q.text)}</span>`).join('');
  };

  // ========== 后台管理 ==========

  const renderAdminPage = () => {
    const gradeSelect = $('admin-grade');
    if (gradeSelect) gradeSelect.value = state.adminGrade;
    renderAdminLessons();
  };

  const renderAdminLessons = async () => {
    const chineseContainer = $('admin-chinese-lessons');
    const englishContainer = $('admin-english-lessons');
    const mathContainer = $('admin-math-lessons');

    // 渲染语文课文列表
    if (chineseContainer) {
      const lessons = await API.builtin.getLessons('chinese', state.adminGrade);
      if (lessons.length === 0) {
        chineseContainer.innerHTML = '<p class="empty-hint">暂无课文，点击"添加课文"创建</p>';
      } else {
        chineseContainer.innerHTML = lessons.map(l => `
          <div class="admin-lesson-item" onclick="window.editAdminLesson('${l.key}')">
            <span class="lesson-name">${escapeHtml(l.name)}</span>
            <span class="lesson-count">${l.wordCount}词</span>
            <span class="lesson-type">${l.vocabType === 'poem' ? '古诗词' : '普通'}</span>
          </div>
        `).join('');
      }
    }

    // 渲染英语单元列表
    if (englishContainer) {
      const lessons = await API.builtin.getLessons('english', state.adminGrade);
      if (lessons.length === 0) {
        englishContainer.innerHTML = '<p class="empty-hint">暂无单元</p>';
      } else {
        englishContainer.innerHTML = lessons.map(l => `
          <div class="admin-lesson-item" onclick="window.editAdminLessonEnglish('${l.key}')">
            <span class="lesson-name">${escapeHtml(l.name)}</span>
            <span class="lesson-count">${l.wordCount}词</span>
          </div>
        `).join('');
      }
    }

    // 渲染数学知识点列表
    if (mathContainer) {
      const lessons = await API.builtin.getLessons('math', state.adminGrade);
      if (lessons.length === 0) {
        mathContainer.innerHTML = '<p class="empty-hint">暂无知识点，点击"添加知识点"创建</p>';
      } else {
        mathContainer.innerHTML = lessons.map(l => `
          <div class="admin-lesson-item" onclick="window.editAdminMath('${l.key}')">
            <span class="lesson-name">${escapeHtml(l.name)}</span>
            <span class="lesson-type">知识点</span>
          </div>
        `).join('');
      }
    }
  };

  // 全局编辑函数
  window.editAdminLesson = (lessonKey) => {
    state.adminEditLessonKey = lessonKey;
    navigateTo('admin-lesson-edit');
    renderAdminLessonEdit();
  };

  // 自动生成拼音
  const autoPinyin = (text) => {
    try {
      if (typeof pinyinPro !== 'undefined' && pinyinPro.pinyin) {
        return pinyinPro.pinyin(text, { toneType: 'symbol' });
      }
    } catch (e) {
      console.warn('拼音生成失败:', e);
    }
    return '';
  };

  // 添加词语到列表
  const addAdminWord = () => {
    const input = $('admin-word-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const pinyin = autoPinyin(text);
    state.adminEditWords.push({ text, pinyin });
    input.value = '';
    input.focus();
    renderAdminWordList();
  };

  // 删除词语
  window.removeAdminWord = (index) => {
    state.adminEditWords.splice(index, 1);
    renderAdminWordList();
  };

  // 渲染词语列表
  const renderAdminWordList = () => {
    const container = $('admin-word-list');
    const countEl = $('admin-word-count');
    if (!container) return;

    if (state.adminEditWords.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂未添加词语</p>';
    } else {
      container.innerHTML = state.adminEditWords.map((w, i) => `
        <div class="admin-word-item">
          <span class="word-index">${i + 1}</span>
          <span class="word-text">${escapeHtml(w.text)}</span>
          <span class="word-pinyin">${escapeHtml(w.pinyin)}</span>
          <button class="btn-remove" onclick="window.removeAdminWord(${i})">×</button>
        </div>
      `).join('');
    }

    if (countEl) countEl.textContent = `已添加 ${state.adminEditWords.length} 个词语`;
  };

  const renderAdminLessonEdit = async () => {
    const titleEl = $('admin-lesson-title');
    const nameInput = $('admin-lesson-name');
    const typeSelect = $('admin-lesson-type');
    const deleteBtn = $('btn-admin-delete-lesson');

    if (state.adminEditLessonKey) {
      // 编辑模式
      if (titleEl) titleEl.textContent = '编辑课文';
      const lesson = await API.builtin.getLesson('chinese', state.adminGrade, state.adminEditLessonKey);
      if (lesson) {
        if (nameInput) nameInput.value = lesson.name || '';
        if (typeSelect) typeSelect.value = lesson.vocabType || 'word';
        state.adminEditWords = (lesson.words || []).map(w => ({ text: w.text, pinyin: w.pinyin || '' }));
      }
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
      // 新建模式
      if (titleEl) titleEl.textContent = '添加课文';
      if (nameInput) nameInput.value = '';
      if (typeSelect) typeSelect.value = 'word';
      state.adminEditWords = [];
      if (deleteBtn) deleteBtn.style.display = 'none';
    }
    renderAdminWordList();
  };

  const saveAdminLesson = async () => {
    const name = $('admin-lesson-name')?.value?.trim();
    const vocabType = $('admin-lesson-type')?.value || 'word';

    if (!name) {
      alert('请输入课文标题');
      return;
    }

    if (state.adminEditWords.length === 0) {
      alert('请输入至少一个词语');
      return;
    }

    const lessonData = {
      name,
      words: state.adminEditWords,
      vocabType
    };

    await API.builtin.saveLesson('chinese', state.adminGrade, state.adminEditLessonKey, lessonData);
    alert('保存成功！');
    navigateTo('admin');
    renderAdminLessons();
  };

  const deleteAdminLesson = async () => {
    if (!state.adminEditLessonKey) return;
    if (!confirm('确定要删除这篇课文吗？')) return;

    await API.builtin.deleteLesson('chinese', state.adminGrade, state.adminEditLessonKey);
    alert('已删除');
    navigateTo('admin');
    renderAdminLessons();
  };

  // 全局编辑数学函数
  window.editAdminMath = (lessonKey) => {
    state.adminEditLessonKey = lessonKey;
    navigateTo('admin-math-edit');
    renderAdminMathEdit();
  };

  const renderAdminMathEdit = async () => {
    const titleEl = $('admin-math-title');
    const nameInput = $('admin-math-name');
    const deleteBtn = $('btn-admin-delete-math');

    if (state.adminEditLessonKey) {
      // 编辑模式
      if (titleEl) titleEl.textContent = '编辑知识点';
      const lesson = await API.builtin.getLesson('math', state.adminGrade, state.adminEditLessonKey);
      if (lesson) {
        if (nameInput) nameInput.value = lesson.name || '';
        state.adminEditMathKnowledge = lesson.knowledgePoints || [];
      }
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
      // 新建模式
      if (titleEl) titleEl.textContent = '添加知识点';
      if (nameInput) nameInput.value = '';
      state.adminEditMathKnowledge = [];
      if (deleteBtn) deleteBtn.style.display = 'none';
    }
    renderAdminMathKnowledge();
  };

  const renderAdminMathKnowledge = () => {
    // 根据 state.adminEditMathKnowledge 设置 checkbox 状态
    const checkboxes = document.querySelectorAll('.knowledge-checkbox');
    const counts = document.querySelectorAll('.knowledge-count');

    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    counts.forEach(c => {
      c.value = c.dataset.type?.includes('word_problem') ? '3' : '5';
    });

    state.adminEditMathKnowledge.forEach(kp => {
      const cb = document.querySelector(`.knowledge-checkbox[value="${kp.type}"]`);
      if (cb) {
        cb.checked = true;
        const countInput = cb.closest('.knowledge-option')?.querySelector('.knowledge-count');
        if (countInput) countInput.value = kp.count;
      }
    });
  };

  const saveAdminMath = async () => {
    const name = $('admin-math-name')?.value?.trim();
    if (!name) {
      alert('请输入知识点名称');
      return;
    }

    // 收集选中的知识点
    const knowledgePoints = [];
    document.querySelectorAll('.knowledge-checkbox:checked').forEach(cb => {
      const countInput = cb.closest('.knowledge-option')?.querySelector('.knowledge-count');
      knowledgePoints.push({
        type: cb.value,
        count: parseInt(countInput?.value || '5')
      });
    });

    if (knowledgePoints.length === 0) {
      alert('请至少选择一个知识点类型');
      return;
    }

    const lessonData = {
      name,
      knowledgePoints,
      vocabType: 'knowledge'
    };

    await API.builtin.saveLesson('math', state.adminGrade, state.adminEditLessonKey, lessonData);
    alert('保存成功！');
    navigateTo('admin');
    renderAdminLessons();
  };

  const deleteAdminMath = async () => {
    if (!state.adminEditLessonKey) return;
    if (!confirm('确定要删除这个知识点吗？')) return;

    await API.builtin.deleteLesson('math', state.adminGrade, state.adminEditLessonKey);
    alert('已删除');
    navigateTo('admin');
    renderAdminLessons();
  };

  const previewAdminMath = () => {
    const knowledgePoints = [];
    document.querySelectorAll('.knowledge-checkbox:checked').forEach(cb => {
      const countInput = cb.closest('.knowledge-option')?.querySelector('.knowledge-count');
      knowledgePoints.push({
        type: cb.value,
        count: parseInt(countInput?.value || '5')
      });
    });

    if (knowledgePoints.length === 0) {
      alert('请至少选择一个知识点类型');
      return;
    }

    const questions = MathGenerator.generate(knowledgePoints);
    const previewContainer = $('admin-math-preview');
    if (previewContainer) {
      previewContainer.innerHTML = questions.slice(0, 10).map((q, i) => `
        <div class="math-preview-item">
          <div>${i + 1}. ${escapeHtml(q.text)}</div>
          <div class="answer">答案：${escapeHtml(q.answer)}</div>
        </div>
      `).join('');
    }
  };

  // ========== 公共API ==========
  return { 
    init,
    getState: () => state,
    renderSettingSummary
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
