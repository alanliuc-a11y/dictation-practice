# 小学生每日练习系统 — 功能修改规格文档 v5

## 修改时间
2026-04-28

## 修改背景

v4版本部署后，用户实际使用发现4个问题：

| # | 问题 | 根因分析 |
|---|------|----------|
| 1 | 打印预览需左右拖动才能看全页，打印后内容只占A4一半宽度 | `.preview-paper` 固定 `width:210mm`（793px）超出手机屏幕，`scalePreviewPaper()` 缩放后容器仍有 `overflow-x:auto`；`@media print` 中 `.line-blank` 使用固定px宽度，打印分辨率下比例不对 |
| 2 | 语文词库需支持单词/句子/古诗词三种输入 | 当前只有"词语+拼音"一种格式，句子和古诗词的长度和输入方式完全不同 |
| 3 | 英语词库需支持单词/短语两种输入 | 当前只有"单词+释义"一种格式，短语的输入区域和书写横线需要更宽 |
| 4 | 数学需支持知识点自动出题+手动补充 | 用户选择方案C混合模式，输入知识点描述后程序自动生成题目，同时支持手动补充 |

---

## 一、打印预览和打印排版修复（问题1）

### 1.1 根因分析

**预览问题**：
- `.preview-paper` 设置 `width: 210mm`（约793px @96dpi），手机屏幕约375px
- `scalePreviewPaper()` 通过 `transform: scale()` 缩放，但容器 `#page-preview .page-inner` 设了 `overflow-x: auto`，导致缩放后仍可横向滚动
- 缩放后的 marginBottom 补偿计算也可能有误差

**打印问题**：
- `@media print` 中 `.preview-paper` 设置 `width: 100%`，但内容区实际取的是打印视口宽度
- `.line-blank` 的宽度由 `getLineWidth()` 返回固定px值（如70px、90px），在打印中1个中文字约12pt≈16px，一个词语的横线应约3-4em而非固定px
- `.practice-grid` 的 `gap: 10px 28px` 在打印时偏大，导致一行只能放2-3个词
- 打印时 `.preview-paper` 有 `transform` 残留可能影响布局

### 1.2 修复方案

#### 预览缩放优化

1. 移除 `#page-preview .page-inner` 和 `#page-answer .page-inner` 的 `overflow-x: auto`
2. 确保 `scalePreviewPaper()` 正确计算缩放比例，容器高度自适应

```css
/* 修改前 */
#page-preview .page-inner,
#page-answer .page-inner {
  max-width: 100%;
  overflow-x: auto;
}

/* 修改后 */
#page-preview .page-inner,
#page-answer .page-inner {
  max-width: 100%;
  overflow: hidden;
}
```

#### 打印排版重写

1. `@media print` 中 `.line-blank` 宽度改用 `em` 单位
2. `.practice-grid` 使用自适应列布局，`gap` 缩小
3. 移除打印时的 `transform`
4. `getLineWidth()` 返回 `em` 值而非 `px` 值

```css
@media print {
  .preview-paper {
    transform: none !important;
    width: 100%;
    padding: 0;
    min-height: auto;
  }

  .practice-grid {
    gap: 6px 16px;
  }

  .line-blank {
    height: 2.5em;
  }
}
```

```javascript
// getLineWidth 改为返回 em 值
function getLineWidth(subject, text, wordType) {
  if (wordType === 'sentence' || wordType === 'poem') {
    return 0; // 占满一行，不用固定宽度
  }
  if (subject === 'chinese') {
    return Math.max(3, text.length * 1.2 + 1.5); // em
  } else if (subject === 'english') {
    return Math.max(4, text.length * 0.6 + 1.5); // em
  }
  return 5; // em，数学默认
}
```

### 1.3 涉及文件

| 文件 | 修改 |
|------|------|
| `css/style.css` | 修复预览overflow、重写@media print排版 |
| `js/app.js` | `getLineWidth()` 改返回em值、`scalePreviewPaper()` 优化、`renderPreviewPage()` 适配 |

---

## 二、语文词库支持三种输入类型（问题2）

### 2.1 三种类型定义

| 类型 | vocabType | 输入格式 | 书写横线 | 示例 |
|------|-----------|----------|----------|------|
| 单词 | `word` | 词语+拼音 | 短（按字数） | 池塘 chí táng |
| 句子 | `sentence` | 整句文本 | 占满一行 | 春天来了，万物复苏。 |
| 古诗词 | `poem` | 标题+作者+正文 | 占满一行（整首诗一条） | 静夜思 李白 床前明月光… |

### 2.2 数据结构

```javascript
// 语文单词（与当前一致）
{ type: "word", text: "池塘", pinyin: "chí táng" }

// 语文句子
{ type: "sentence", text: "春天来了，万物复苏。" }

// 语文古诗词
{ type: "poem", title: "静夜思", author: "李白", text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。" }
```

### 2.3 词库编辑页UI

学科选择下方增加"词库类型"选择器：

```
┌──────────────────────────────────────┐
│ 学科：[语文 ▼]                       │
│ 类型：[单词 ▼]  ← 新增               │
│       选项：单词 | 句子 | 古诗词      │
│ 年级学期：[二年级上册 ▼]              │
│ 课文名称：[____________]              │
└──────────────────────────────────────┘
```

**单词模式**（与当前一致）：
```
1. [池塘] [chí táng]  [×]
2. [眼睛] [yǎn jing]  [×]
```

**句子模式**：
```
1. [春天来了，万物复苏。____________________]  [×]
   （输入框更宽，无拼音字段）
```

**古诗词模式**：
```
1. 标题：[静夜思]  作者：[李白]
   正文：[床前明月光，疑是地上霜。举头望明月，低头思故乡。]
   [×]
```

### 2.4 批量导入格式

**单词**（当前已有）：
```
池塘 chí táng
眼睛 yǎn jing
```

**句子**：
```
春天来了，万物复苏。
小蝌蚪游来游去。
```
每行一句，无需拼音。

**古诗词**：
```
静夜思|李白|床前明月光，疑是地上霜。举头望明月，低头思故乡。
春晓|孟浩然|春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。
```
格式：`标题|作者|正文`，用 `|` 分隔。

### 2.5 预览/打印适配

- 单词：当前网格布局，多个词一行
- 句子：每句独占一行，横线占满整行宽度
- 古诗词：每首诗独占一个区块，标题+作者居中，正文横线占满整行

---

## 三、英语词库支持两种输入类型（问题3）

### 3.1 两种类型定义

| 类型 | vocabType | 输入格式 | 书写横线 | 示例 |
|------|-----------|----------|----------|------|
| 单词 | `word` | 单词+释义 | 中等 | apple 苹果 |
| 短语 | `phrase` | 短语+释义 | 较长 | good morning 早上好 |

### 3.2 数据结构

```javascript
// 英语单词（与当前一致）
{ type: "word", text: "apple", meaning: "苹果" }

// 英语短语
{ type: "phrase", text: "good morning", meaning: "早上好" }
```

### 3.3 词库编辑页UI

```
类型：[单词 ▼]  ← 新增
      选项：单词 | 短语
```

**单词模式**（与当前一致）：
```
1. [apple] [苹果]  [×]
```

**短语模式**：
```
1. [good morning] [早上好]  [×]
   （输入框更宽）
```

### 3.4 批量导入格式

**单词**（当前已有）：
```
apple 苹果
book 书本
```

**短语**：
```
good morning 早上好
how are you 你好吗
```
格式与单词一致，只是短语可能包含空格。解析时取第一个空格前的英文部分不对——需要特殊处理。

**解析规则改进**：英语短语/单词的解析，以**第一个中文字符**为分界点：
- `apple 苹果` → text:"apple", meaning:"苹果"
- `good morning 早上好` → text:"good morning", meaning:"早上好"
- `how are you 你好吗` → text:"how are you", meaning:"你好吗"

实现：正则 `/^([a-zA-Z\s]+)\s+([\u4e00-\u9fa5].*)$/`

---

## 四、数学混合出题模式（问题4 — 方案C）

### 4.1 两种模式定义

| 模式 | vocabType | 输入方式 | 示例 |
|------|-----------|----------|------|
| 知识点 | `knowledge` | 选择知识点类型+生成数量 | "2位数加法" × 10题 |
| 手动 | `manual` | 直接输入题目 | 23+45= |

### 4.2 数据结构

```javascript
{
  subject: "math",
  vocabType: "knowledge",  // "knowledge" | "manual"
  name: "2位数加减法练习",
  knowledgePoints: [       // 仅 knowledge 类型有此字段
    { type: "addition_2digit", label: "2位数加法", count: 5 },
    { type: "subtraction_2digit_no_borrow", label: "2位数减法(不退位)", count: 5 }
  ],
  words: [
    { text: "23+45=", type: "auto" },     // 自动生成
    { text: "100-37=", type: "manual" }   // 手动补充
  ]
}
```

### 4.3 自动生成规则

| 知识点type | 说明 | 生成规则 | 示例 |
|------------|------|----------|------|
| `addition_1digit` | 1位数加法 | a,b∈[1,9] | 3+5= |
| `addition_2digit_no_carry` | 2位数加法(不进位) | a∈[10,99], b∈[1,9], 个位之和<10 | 23+5= |
| `addition_2digit_carry` | 2位数加法(进位) | a∈[10,99], b∈[1,9], 个位之和≥10 | 27+5= |
| `addition_2digit` | 2位数加法 | a,b∈[10,99] | 23+45= |
| `subtraction_1digit` | 1位数减法 | a>b, a,b∈[1,9] | 8-3= |
| `subtraction_2digit_no_borrow` | 2位数减法(不退位) | a>b∈[10,99], 个位够减 | 56-23= |
| `subtraction_2digit_borrow` | 2位数减法(退位) | a>b∈[10,99], 个位不够减 | 52-27= |
| `subtraction_2digit` | 2位数减法 | a>b∈[10,99] | 78-45= |
| `multiplication_99` | 九九乘法表 | a,b∈[1,9] | 7×8= |
| `division_simple` | 简单除法 | 先生成乘法a×b=c, 再出c÷a= | 56÷8= |

**生成器保证**：
- 减法结果不为负数
- 除法能整除
- 同一批次无重复题目
- 加法结果不超过200

### 4.4 词库编辑页UI

```
类型：[知识点 ▼]  ← 新增
      选项：知识点 | 手动输入

[知识点模式]
┌──────────────────────────────────────┐
│ 知识点列表：                          │
│ ┌──────────────────────────────┐     │
│ │ [2位数加法 ▼]  数量：[5]  [×]│     │
│ │ [九九乘法表 ▼]  数量：[3]  [×]│     │
│ └──────────────────────────────┘     │
│ [+ 添加知识点]                        │
│                                      │
│ 预览生成题目：                        │
│ 23+45=  56÷8=  7×8=  ...            │
│                                      │
│ 手动补充：                            │
│ ┌──────────────────────────────┐     │
│ │ 100-37=                      │     │
│ └──────────────────────────────┘     │
│ [导入补充]                           │
└──────────────────────────────────────┘

[手动输入模式]
（与当前语文的批量导入类似，每行一题）
```

### 4.5 听写流程联动

当用户选择数学词库开始听写时：
1. 检查词库 `vocabType === 'knowledge'`
2. 调用 `MathGenerator.generate(knowledgePoints)` 生成自动题目
3. 合并自动题目（type:"auto"）和手动题目（type:"manual"）
4. 用合并后的完整列表进行听写

### 4.6 数学题的TTS朗读

数学题朗读格式：
- `23+45=` → "二十三加四十五等于"
- `56÷8=` → "五十六除以八等于"

需要在 TTS 前将数学表达式转为中文朗读文本。

---

## 五、文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `SPEC_v5.md` | 新增 | 本规格文档 |
| `css/style.css` | 修改 | 1) 预览overflow修复；2) @media print排版重写；3) 词库类型样式；4) 句子/古诗词/短语输入样式；5) 数学知识点配置样式 |
| `js/app.js` | 修改 | 1) getLineWidth改em值；2) scalePreviewPaper优化；3) renderPreviewPage/renderAnswerPage适配多类型；4) 词库类型切换逻辑；5) 数学自动生成联动 |
| `js/data.js` | 修改 | 1) CustomVocab扩展vocabType字段；2) parseImportText适配多类型（句子/古诗词/英语短语/数学）；3) 向后兼容处理 |
| `js/math-generator.js` | 新增 | 数学题目自动生成器模块 |
| `index.html` | 修改 | 1) 词库编辑页增加vocabType选择器；2) 数学知识点配置区；3) 古诗词标题/作者输入字段 |
| `js/tts.js` | 修改 | 数学表达式转中文朗读文本 |
| `js/timer.js` | 不变 | |
| `js/wronglist.js` | 不变 | |
| `js/history.js` | 不变 | |

---

## 六、实施优先级

| 优先级 | 问题 | 原因 |
|--------|------|------|
| P0 | 问题1 打印预览/排版 | 核心功能不可用，打印出的练习纸无法使用 |
| P1 | 问题2 语文多类型 | 词库功能不完整，无法录入句子和古诗词 |
| P1 | 问题3 英语多类型 | 词库功能不完整，无法录入短语 |
| P1 | 问题4 数学混合模式 | 新功能，影响数学学科可用性 |

---

## 七、向后兼容

已有的自定义词库没有 `vocabType` 字段，需默认值处理：
- 语文词库：默认 `vocabType = "word"`
- 英语词库：默认 `vocabType = "word"`
- 数学词库：默认 `vocabType = "manual"`

已有词库的 words 条目没有 `type` 字段，默认按 `type = "word"` 处理。
