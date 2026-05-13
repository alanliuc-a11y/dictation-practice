# 小学生每日练习系统 — 功能修改规格文档 v4

## 修改时间
2026-04-28

## 修改背景

v3版本部署后，用户实际使用发现5个问题：

| # | 问题 | 根因分析 |
|---|------|----------|
| 1 | 选择课文默认全选，应默认未选 | `renderContentList()` 渲染checkbox时写了 `checked` 属性 |
| 2 | 预览练习纸点击后看不到内容 | `renderPreviewPage()` 在页面 `display:none` 时执行缩放计算，`clientWidth=0` 导致scale≈0，内容被缩放到不可见 |
| 3 | 播报语速仍然太快 | `rate=0.5` 在浏览器Web Speech API中可能被限制下限，实际语速未降到0.5；需进一步降至0.25并做保底处理 |
| 4 | 词语间隔设置秒数依然无效 | Timer逻辑本身正确，但TTS的`onend`回调在部分浏览器（特别是Chrome移动版）中存在bug——`speechSynthesis.cancel()` 可能触发残留的 `onend` 事件导致回调提前执行，绕过了Timer间隔 |
| 5 | 语数外词库需要手动输入方式 | 新功能需求，需设计用户自定义词库输入界面 |

---

## 一、课文默认未选（问题1）

### 1.1 修改位置

`js/app.js` — `renderContentList()` 函数，第196行

### 1.2 修改内容

```javascript
// 修改前
html += '<input type="checkbox" class="unit-checkbox" value="' + key + '" checked> ';

// 修改后
html += '<input type="checkbox" class="unit-checkbox" value="' + key + '"> ';
```

移除 `checked` 属性，使课文列表默认未选中。

---

## 二、预览练习纸不可见（问题2）

### 2.1 根因

`bindEvent('btn-preview', function () { renderPreviewPage(false); navigateTo('preview'); })`

执行顺序：
1. `renderPreviewPage()` — 此时 preview 页面仍是 `display:none`
2. `scalePreviewPaper()` 读取 `container.parentElement.clientWidth` — 得到 **0**
3. 计算 `scale = 0 / 793 = 0` — 内容被缩放到不可见
4. `navigateTo('preview')` — 页面变为可见，但缩放已经错误

### 2.2 修复方案

在 `renderPreviewPage()` 中，将缩放逻辑延迟到页面可见后执行：

```javascript
function renderPreviewPage() {
  // ... 生成 HTML ...

  previewContent.innerHTML = html;

  // 延迟缩放，等待页面可见后再计算宽度
  setTimeout(function () {
    scalePreviewPaper(previewContent);
  }, 50);
}
```

同时在 `navigateTo('preview')` 之后也调用一次缩放，确保在页面切换后也能正确计算。

---

## 三、语速再降一半（问题3）

### 3.1 问题分析

当前 `rate=0.5`，用户反馈仍然太快。Web Speech API 的 `rate` 参数：
- 规范允许范围：0.1 ~ 10
- Chrome 实际下限约 0.1，但部分中文语音引擎可能将 rate 限制在更高值
- 部分浏览器对中文语音的 rate 0.5 效果不明显

### 3.2 修改方案

1. **rate 默认值**从 0.5 降至 **0.25**
2. **rate 下限**从 0.3 降至 **0.1**
3. **增加保底机制**：如果浏览器实际语速未降低，在每次朗读之间增加额外的静默停顿

### 3.3 代码修改

**`js/tts.js`**：
```javascript
// 默认配置
const defaultOptions = {
  rate: 0.25,      // 语速再降低
  pitch: 1.0,
  volume: 1.0,
  repeat: 3,
  interval: 800    // 重复间隔从500ms增加到800ms
};

// 限制范围
options.rate = Math.max(0.1, Math.min(1.5, options.rate));
```

**`js/app.js`** — state 默认值：
```javascript
rate: 0.25
```

### 3.4 额外措施：朗读间增加字间停顿

对于中文朗读，在词语的字之间插入短暂停顿可能比单纯降 rate 更自然。方案：

在 TTS 朗读时，将中文词语拆分为单字，每字之间插入 300ms 停顿，每个单字以正常 rate 朗读：

```javascript
// tts.js 新增 speakSlowChinese 方法
function speakSlowChinese(text, options, onEnd) {
  var chars = text.split('');
  var charIndex = 0;
  
  function speakNextChar() {
    if (charIndex >= chars.length) {
      // 一遍读完，处理 repeat
      repeatCount++;
      if (repeatCount < options.repeat) {
        setTimeout(speakNextChar, options.interval);
      } else {
        if (onEnd) onEnd();
      }
      return;
    }
    
    var char = chars[charIndex];
    var utterance = new SpeechSynthesisUtterance(char);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.6;   // 单字用稍低语速
    utterance.pitch = options.pitch;
    utterance.volume = options.volume;
    
    utterance.onend = function () {
      charIndex++;
      // 字间停顿 300ms
      setTimeout(speakNextChar, 300);
    };
    
    synth.speak(utterance);
  }
  
  speakNextChar();
}
```

> 注意：此方案会显著增加单词朗读时间（2字词约 1.5-2秒 × 3次 = 4.5-6秒），需配合词语间隔使用。

---

## 四、词语间隔修复（问题4）

### 4.1 根因深入分析

经过代码审查，Timer逻辑本身是正确的。问题出在 **Web Speech API 的回调时序**：

**Chrome 已知 bug**：
- `speechSynthesis.cancel()` 会触发当前 utterance 的 `onend` 事件
- `speechSynthesis.speak()` 对于短文本（如2字中文词），`onend` 可能几乎立即触发
- 在某些 Android WebView 中，`onend` 回调时序不可靠

**当前代码问题路径**：
```
playCurrentWord()
  → TTS.speak(word, opts, callback)
    → stop() → synth.cancel() → 可能触发旧utterance的onend
    → cancelled = false
    → speakWord() → synth.speak(utterance)
      → utterance.onend 可能立即触发（短文本bug）
      → repeatCount++ → ... → 最终回调 callback
  → callback: currentIndex++, Timer.start(3秒, ...)
    → Timer可能正常工作
    → 但如果TTS在50ms内就完成了，用户感觉"没有间隔"
    → 实际上有3秒间隔，但TTS本身播放时间太短
```

**另一个可能的bug**：`TTS.speak()` 中先调用 `stop()`，`stop()` 设置 `cancelled = true`。但 `speak()` 紧接着设置 `cancelled = false`（第75行）。如果在 `stop()` 和 `cancelled = false` 之间，浏览器事件循环处理了 `synth.cancel()` 触发的 `onend`，那么：
- `onend` 看到 `cancelled = true` → 返回（正确）
- 但如果 `onend` 在 `cancelled = false` 之后才被处理 → 就会错误执行

### 4.2 修复方案：增加独立的间隔保障机制

不依赖 TTS 的 onend 回调时序，而是使用 **setTimeout 保底**：

```javascript
function playCurrentWord() {
  if (state.dictation.currentIndex >= state.dictation.words.length) {
    finishDictation();
    return;
  }

  var word = state.dictation.words[state.dictation.currentIndex];
  state.dictation.isPlaying = true;
  updateDictationUI();

  var wordEl = document.getElementById('dictation-word');
  if (wordEl) wordEl.classList.add('speaking');

  // 标记TTS是否已完成回调（防止重复触发）
  var ttsCompleted = false;

  function onTTSComplete() {
    if (ttsCompleted) return;  // 防止重复调用
    ttsCompleted = true;

    if (wordEl) wordEl.classList.remove('speaking');

    state.dictation.currentIndex++;

    if (state.dictation.currentIndex >= state.dictation.words.length) {
      finishDictation();
      return;
    }

    updateDictationUI();

    // 词语间隔倒计时
    Timer.start(state.settings.interval, function (remaining) {
      setText('timer-display', remaining + '秒');
    }, function () {
      setText('timer-display', '');
      playCurrentWord();
    });
  }

  TTS.speak(word.text, {
    repeat: state.settings.repeat,
    rate: state.settings.rate,
    interval: 800
  }, onTTSComplete);

  // 安全保底：如果TTS回调5秒内未触发，强制进入下一词
  setTimeout(function () {
    if (!ttsCompleted) {
      console.warn('TTS回调超时，强制进入下一词');
      onTTSComplete();
    }
  }, 15000);  // 15秒超时（3次朗读 × 约4秒/次 + 缓冲）
}
```

### 4.3 其他改进

1. **在 TTS.speak 中增加防重入锁**：
```javascript
let speaking = false;  // 新增：播放锁

function speak(text, options, onEnd) {
  // ...
  if (speaking) {
    console.warn('TTS正在播放中，忽略新请求');
    return;
  }
  speaking = true;
  // ...
  // 在 onEnd 回调中设置 speaking = false
}
```

2. **Timer 显示增强**：在间隔期间显示明显的倒计时提示
```javascript
Timer.start(state.settings.interval, function (remaining) {
  setText('timer-display', '下一词：' + remaining + '秒');
  // 可选：在 dictation-word 区域显示倒计时
}, function () {
  setText('timer-display', '');
  playCurrentWord();
});
```

---

## 五、运营方词库管理（问题5 — 方案B）

### 5.1 需求理解

运营方（非普通用户）需要管理词库内容：
- 语文：输入词语+拼音，按课组织
- 英语：输入单词+释义，按课组织
- 数学：输入术语/知识点
- 支持新建、编辑、删除词库
- 听写时可选择运营方录入的词库

### 5.2 方案：独立词库管理页

新增"词库管理"页面，从首页进入。支持完整的 CRUD 操作。

### 5.3 首页入口

在首页增加"词库管理"按钮（运营方入口），与"开始听写"、"错题本"、"历史记录"并列。

```
┌──────────────────────┐
│   小学生每日练习       │
│   新课标语数外         │
│                      │
│   [开始听写]          │
│   [词库管理]  ← 新增   │
│   [错题本]            │
│   [历史记录]          │
└──────────────────────┘
```

### 5.4 词库管理页 UI

#### 5.4.1 词库列表页（page-vocab-manage）

```
┌──────────────────────────────────────┐
│ ← 返回        词库管理      [+新建]   │
│                                      │
│ 学科筛选：[语文] [英语] [数学] [全部] │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ 📘 语文 · 二年级上册            │   │
│ │ 第1课 小蝌蚪找妈妈 (8词)        │   │
│ │ [编辑] [删除]                  │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ 📘 语文 · 二年级上册            │   │
│ │ 第2课 我是什么 (8词)            │   │
│ │ [编辑] [删除]                  │   │
│ └────────────────────────────────┘   │
│ ...                                  │
│ ┌────────────────────────────────┐   │
│ │ 📗 英语 · 二年级上册            │   │
│ │ Lesson 1 Hello (6词)           │   │
│ │ [编辑] [删除]                  │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

#### 5.4.2 词库编辑页（page-vocab-edit）

```
┌──────────────────────────────────────┐
│ ← 返回        编辑词库      [保存]    │
│                                      │
│ 学科：[语文 ▼]                       │
│ 年级学期：[二年级上册 ▼]              │
│ 课文名称：[第1课 小蝌蚪找妈妈____]    │
│                                      │
│ 词语列表：                            │
│ ┌──────────────────────────────┐     │
│ │ 1. 池塘  chí táng    [×]     │     │
│ │ 2. 眼睛  yǎn jing    [×]     │     │
│ │ 3. 露出  lù chū      [×]     │     │
│ │ ...                          │     │
│ └──────────────────────────────┘     │
│                                      │
│ 批量导入：                            │
│ ┌──────────────────────────────┐     │
│ │ 池塘 chí táng                 │     │
│ │ 眼睛 yǎn jing                 │     │
│ │ （每行一词，格式：词语 拼音）   │     │
│ └──────────────────────────────┘     │
│ [导入]                               │
│                                      │
│ [+ 添加词语]                         │
└──────────────────────────────────────┘
```

### 5.5 数据结构

```javascript
// localStorage key: 'custom_vocab_list'
// 存储运营方创建的自定义词库列表
[
  {
    id: "cv_1682600000000",      // 唯一ID（时间戳）
    subject: "chinese",          // 学科
    grade: "grade2_semester1",   // 年级学期
    name: "第1课 小蝌蚪找妈妈",   // 课文名称
    words: [
      { text: "池塘", pinyin: "chí táng" },
      { text: "眼睛", pinyin: "yǎn jing" }
    ],
    createdAt: "2026-04-28",
    updatedAt: "2026-04-28"
  }
]
```

### 5.6 解析规则

批量导入时的文本解析：
- **语文**：`词语 拼音`（空格或Tab分隔，拼音可选）
  - 例：`池塘 chí táng` → text:"池塘", pinyin:"chí táng"
  - 例：`词语` → text:"词语", pinyin:""（拼音留空）
- **英语**：`单词 释义`（空格或Tab分隔，释义可选）
  - 例：`apple 苹果` → text:"apple", meaning:"苹果"
- **数学**：`术语`（纯文本）
- 空行跳过
- 以 `#` 开头的行为注释

### 5.7 听写设置页联动

在设置页"选择课文"区域，同时展示：
1. **内置词库**：`data.js` 中预置的课文
2. **自定义词库**：localStorage 中的运营方词库

自定义词库用不同的图标/标签标识（如带"自定义"角标）。

### 5.8 涉及文件

| 文件 | 修改 |
|------|------|
| `index.html` | 新增 `page-vocab-manage` 和 `page-vocab-edit` 页面 |
| `js/app.js` | 新增词库管理页的路由和渲染逻辑 |
| `js/data.js` | 新增 `CustomVocab` 模块（localStorage CRUD） |
| `css/style.css` | 词库管理页样式 |

---

## 六、文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `SPEC_v4.md` | 新增 | 本规格文档 |
| `js/app.js` | 修改 | 1) 课文默认未选；2) 预览缩放延迟；3) TTS回调防重复+超时保底；4) 词库管理页逻辑 |
| `js/tts.js` | 修改 | rate降至0.25、下限降至0.1、重复间隔增至800ms |
| `js/data.js` | 修改 | 新增 `CustomVocab` 模块（localStorage CRUD） |
| `index.html` | 修改 | 新增词库管理页 `page-vocab-manage` + 编辑页 `page-vocab-edit` |
| `css/style.css` | 修改 | 词库管理页样式 |
| `js/timer.js` | 不变 | 逻辑无问题 |

---

## 七、实施优先级

| 优先级 | 问题 | 原因 |
|--------|------|------|
| P0 | 问题4 词语间隔无效 | 核心功能不可用 |
| P0 | 问题2 预览纸不可见 | 核心功能不可用 |
| P1 | 问题3 语速太快 | 影响使用体验 |
| P1 | 问题1 课文默认未选 | 影响使用体验 |
| P1 | 问题5 运营方词库管理 | 新功能，方案B独立管理页 |
