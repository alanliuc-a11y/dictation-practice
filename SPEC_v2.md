# 小学生每日练习系统 — 功能修改规格文档 v2

## 修改时间
2026-04-28

## 一、首页修改

### 1.1 标题文字修改
- **主标题**：`听写练习` → `小学生每日练习`
- **副标题**：`小学生语文听写助手` → `新课标语数外`
- **文件**：`index.html` line 13、14
- **页面标题**（`<title>`标签）：`听写练习` → `小学生每日练习`

---

## 二、设置页重构（新增学科选择 + 打印预览）

### 2.1 页面结构变更

设置页（`#page-settings`）改为三步流程：

```
[步骤1：学科选择] → [步骤2：内容选择] → [步骤3：播放设置+预览+打印]
```

**步骤1 - 学科选择（新增）**
- 三个学科标签按钮横向排列：`语文` / `英语` / `数学`
- 默认选中 `语文`
- 切换学科后，步骤2内容区清空并重新渲染

**步骤2 - 内容选择（改造）**
- 语文：显示各单元名称 + 勾选框（现有逻辑不变，但重新渲染为步骤2样式）
- 英语：显示各单元名称 + 勾选框（待用户补充词库后替换为真实内容）
- 数学：显示各知识点名称 + 勾选框（待用户补充内容后替换为真实内容）
- 支持多选，至少选一个才能进入下一步

**步骤3 - 播放设置 + 预览 + 打印（新增）**
- 显示已选内容摘要（学科 + 已选单元/知识点名称）
- 播放设置：
  - `每词播放次数`：1次 / 2次 / **3次（默认改为3次）**
  - `词语间隔`：2秒 / 3秒 / 5秒 / 8秒（设置有效）
  - `朗读方式`：整词朗读 / **逐字朗读（新增，默认逐字）**
    - 逐字朗读：每个字之间间隔 **1000ms**，用户反馈太快了需要此间隔
    - 整词朗读：按正常语速读整个词语
- `预览` 按钮：点击后显示词语预览列表（可打印的格式）
- `打印` 按钮：调用浏览器打印，将预览内容输出为打印样式
- `开始听写` 按钮：进入听写流程

### 2.2 预览/打印功能详细规格

**预览内容：**
- 标题：显示学科 + 选中单元/知识点名称 + 日期
- 词语列表：每行一个词语，带拼音（语文）/ 单词+中文（英语）/ 题目+答案（数学）
- 打印纸规格：竖向 A4，每行词语左侧留空供学生书写
- 拼音/释义显示在词语右侧或下方，字号偏小

**打印样式（`@media print`）：**
- 隐藏所有按钮和导航元素
- 仅显示词语列表区域
- 每行格式：`____ 词语  拼音/释义`
- 每页打印行数：约 25-30 行（自动分页）
- 页眉：学科名称 + 单元名称 + 日期
- 页脚：第 X 页 / 共 Y 页
- 字体：黑体/宋体，清晰易读

**预览区域（屏幕显示）：**
- 与打印样式一致，但额外显示"打印"按钮
- 支持手机端竖屏查看

### 2.3 朗读方式详细规格

**逐字朗读模式（默认）：**
- 将词语拆分为单字
- 每个字单独创建一个 `SpeechSynthesisUtterance`
- 字与字之间间隔 **1000ms**
- 整词重复次数由"每词播放次数"控制（默认3次）
- 适用于学生跟写练习

**整词朗读模式：**
- 现有逻辑不变，语速正常
- 适合复习或检查

---

## 三、TTS 修改（逐字朗读 + 词语间隔修复）

### 3.1 逐字朗读实现

`tts.js` 新增 `mode` 参数：

```javascript
// tts.speak(text, options, onEnd)
// options 新增：
//   mode: 'word' | 'char'  // 'char' = 逐字朗读（默认）
//   charInterval: 1000     // 字与字之间间隔ms
```

- `mode: 'char'` 时，按单字拆分朗读，每字间隔 `charInterval`（默认1000ms）
- `mode: 'word'` 时，按整词朗读（现有行为）
- 每个字朗读完后调用 `charInterval` 再读下一个字
- 整词重复逻辑不变：repeat=3 时，将 逐字朗读序列 重复3遍

### 3.2 词语间隔修复

**问题**：`app.js` 中 `playCurrentWord` 调用 TTS 时 `interval: 500` 是 TTS 内部的重复间隔，不是词语间隔。

**修复**：
- TTS 不再负责词语间的长间隔
- 词语间隔完全由 `timer.js` 控制（在 `markWord` 函数中 `Timer.start(state.settings.interval, ...)`）
- TTS 的 `interval` 参数仅用于整词重复时字词间的短停（保持 500ms）
- 确保用户设置的"词语间隔"（2/3/5/8秒）准确生效

---

## 四、数据层扩展

### 4.1 `data.js` 结构调整

```javascript
const VOCAB = {
  chinese: {
    grade2_semester1: { ... },  // 现有语文词库
    grade2_semester2: { }        // 下册（待补充）
  },
  english: {
    grade2_semester1: { }        // 待用户提供
  },
  math: {
    grade2_semester1: { }        // 待用户提供
  }
};
```

### 4.2 state 结构调整

```javascript
state.settings = {
  subject: 'chinese',   // 'chinese' | 'english' | 'math'
  content: [],           // 选中的单元/知识点key列表
  repeat: 3,             // 默认改为3
  interval: 3,           // 词语间隔（秒）
  mode: 'char',          // 'word' | 'char'
  charInterval: 1000    // 逐字朗读时字间隔
}
```

---

## 五、HTML 结构修改

### 5.1 index.html 设置页新结构

```html
<div id="page-settings" class="page">
  <div class="page-inner">
    <div class="page-header">
      <button class="btn-back" id="btn-settings-back">← 返回</button>
      <h2>每日练习</h2>
    </div>

    <!-- 步骤1：学科选择 -->
    <div class="settings-step" id="step-subject">
      <h3>选择学科</h3>
      <div class="subject-tabs">
        <button class="btn-subject active" data-subject="chinese">语文</button>
        <button class="btn-subject" data-subject="english">英语</button>
        <button class="btn-subject" data-subject="math">数学</button>
      </div>
    </div>

    <!-- 步骤2：内容选择 -->
    <div class="settings-step" id="step-content">
      <h3 id="content-title">选择单元</h3>
      <div id="content-list" class="unit-list"></div>
    </div>

    <!-- 步骤3：播放设置+预览 -->
    <div class="settings-step" id="step-review">
      <h3>练习设置</h3>
      <div class="setting-row">
        <label for="set-repeat">每词播放次数</label>
        <select id="set-repeat">
          <option value="1">1次</option>
          <option value="2">2次</option>
          <option value="3" selected>3次</option>
        </select>
      </div>
      <div class="setting-row">
        <label for="set-interval">词语间隔</label>
        <select id="set-interval">
          <option value="2">2秒</option>
          <option value="3" selected>3秒</option>
          <option value="5">5秒</option>
          <option value="8">8秒</option>
        </select>
      </div>
      <div class="setting-row">
        <label for="set-mode">朗读方式</label>
        <select id="set-mode">
          <option value="char" selected>逐字朗读（推荐）</option>
          <option value="word">整词朗读</option>
        </select>
      </div>
      <div class="setting-summary" id="setting-summary"></div>
      <button class="btn btn-secondary" id="btn-preview">📋 预览练习纸</button>
      <button class="btn btn-primary btn-large" id="btn-start-dictation">开始听写</button>
    </div>
  </div>
</div>
```

### 5.2 预览区域（动态插入）

```html
<!-- 预览浮层/页面 -->
<div id="page-preview" class="page">
  <div class="page-inner">
    <div class="page-header">
      <button class="btn-back" id="btn-preview-back">← 返回设置</button>
      <h2>练习纸预览</h2>
      <button class="btn btn-primary" id="btn-print">🖨️ 打印</button>
    </div>
    <div id="preview-content" class="preview-paper"></div>
  </div>
</div>
```

---

## 六、CSS 样式补充

### 6.1 新增样式

```css
/* 学科标签 */
.subject-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.btn-subject {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  background: var(--gray-light);
  border: 2px solid transparent;
  font-size: 18px;
}
.btn-subject.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

/* 步骤导航 */
.settings-step { margin-bottom: 20px; }

/* 预览纸（打印用） */
.preview-paper {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  font-family: "SimSun", "宋体", serif;
}
.preview-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #333;
}
.preview-row {
  display: flex;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px dotted #ccc;
  page-break-inside: avoid;
}
.preview-write-line {
  width: 120px;
  border-bottom: 1px solid #333;
  margin-right: 12px;
}
.preview-word {
  font-size: 18px;
  min-width: 80px;
}
.preview-pinyin {
  font-size: 14px;
  color: #666;
  margin-left: 8px;
}

/* @media print */
@media print {
  body * { visibility: hidden; }
  #preview-content, #preview-content * { visibility: visible; }
  #preview-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20mm 15mm;
    background: #fff;
  }
  .preview-paper {
    padding: 0;
    background: transparent;
  }
  .btn-print, .btn-back { display: none !important; }
  .preview-row { page-break-inside: avoid; }
}
```

---

## 七、app.js 逻辑修改清单

| 序号 | 修改项 | 文件 | 说明 |
|------|--------|------|------|
| 1 | `state.settings` 结构更新 | app.js | 新增 subject/mode/charInterval |
| 2 | `initSettingsPage()` 重构 | app.js | 改为三步骤流程 |
| 3 | `renderSubjectTabs()` 新增 | app.js | 渲染学科标签 |
| 4 | `renderContentList()` 新增 | app.js | 根据学科渲染内容列表 |
| 5 | `renderPreview()` 新增 | app.js | 生成预览HTML |
| 6 | `renderPrintableList()` 逻辑 | app.js | 生成可打印词语列表 |
| 7 | `initPreviewPage()` 新增 | app.js | 绑定预览页按钮 |
| 8 | `prepareDictation()` 更新 | app.js | 支持多学科 |
| 9 | `playCurrentWord()` 传参 | app.js | 传入 mode=char 和 charInterval=1000 |
| 10 | `finishDictation()` 更新 | app.js | 支持多学科历史记录 |
| 11 | `renderResult()` | app.js | 支持英语/数学 |
| 12 | `renderHistory()` | app.js | 支持多学科 |
| 13 | `renderWronglist()` | app.js | 支持多学科 |

---

## 八、tts.js 逻辑修改清单

| 序号 | 修改项 | 说明 |
|------|--------|------|
| 1 | 新增 `mode` 参数 | 'word' | 'char'，默认 'char' |
| 2 | 新增 `charInterval` 参数 | 逐字朗读时间隔ms，默认1000 |
| 3 | `speak()` 函数改造 | 当 mode='char' 时，按字拆分朗读 |
| 4 | 保持所有现有功能 | stop/pause/resume/isSupported/isSpeaking |

---

## 九、待用户补充的数据

以下内容需要用户提供词库后替换：
- `VOCAB.english.grade2_semester1` — 小学英语沪教牛津版词库
- `VOCAB.math.grade2_semester1` — 小学二年级数学知识点列表
- `VOCAB.chinese.grade2_semester2` — 语文下册（可选）

---

## 十、开发优先级

**P0（必须实现）：**
1. 首页标题修改
2. 学科选择 + 内容选择（先做语文，英语/数学留空结构）
3. 逐字朗读功能 + charInterval=1000ms
4. 打印预览页面
5. 词语间隔修复
6. 每词播放次数默认值改为3

**P1（下阶段）：**
7. 英语/数学内容填充
8. 错题本支持多学科

---

## 十一、测试验证要求

完成修改后，必须验证以下场景：

1. ✅ 首页显示"小学生每日练习" / "新课标语数外"
2. ✅ 切换语文/英语/数学标签，内容列表相应变化
3. ✅ 选完单元后点击"预览练习纸"，正确显示词语列表
4. ✅ 点击"打印"按钮，弹出系统打印对话框
5. ✅ 逐字朗读时，每个字之间有明显停顿（约1秒）
6. ✅ 词语间隔设置（2/3/5/8秒）生效
7. ✅ 每词播放次数默认为3次
8. ✅ 错题本、历史记录正常记录
