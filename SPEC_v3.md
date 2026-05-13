# 小学生每日练习系统 — 功能修改规格文档 v3

## 修改时间
2026-04-28

## 修改背景

基于用户实际使用反馈，v2版本存在以下6个问题需要修复和改进：

| # | 问题 | 根因 |
|---|------|------|
| 1 | 语文和英语以单元选择，粒度太粗 | 数据结构按unit组织，应改为按课(lesson)组织 |
| 2 | 逐字朗读体验不佳，应改为整词慢速朗读 | 逐字拆分朗读不自然，改为整词朗读+语速减半 |
| 3 | 词语间隔设置无效 | 间隔Timer依赖家长手动点击对错才触发，应改为自动触发 |
| 4 | 打印纸上显示了要默写的词语 | 预览/打印应只显示空白横线，不显示答案 |
| 5 | 打印纸每行只放一个词语，浪费纸张 | 应按A4格式多词一行排列 |
| 6 | 每词需手动确认对错，操作繁琐 | 应改为自动顺序播报，播完后查看答案 |

---

## 一、词库按课选择（问题1）

### 1.1 数据结构改造

**当前结构**（按单元）：
```javascript
VOCAB.chinese.grade2_semester1.unit1 = { name: "第一单元", words: [...] }
```

**新结构**（按课）：
```javascript
VOCAB.chinese.grade2_semester1.lesson1 = { name: "第1课 小蝌蚪找妈妈", words: [...] }
```

### 1.2 设置页UI变更

- 步骤2标题从"选择单元"改为"选择课文"
- 内容列表渲染改为遍历 `lesson1/lesson2/...`
- 勾选框显示格式：`☑ 第1课 小蝌蚪找妈妈 (8词)`

### 1.3 英语词库同理

英语也按课组织，结构预留：
```javascript
VOCAB.english.grade2_semester1.lesson1 = { name: "Lesson 1 Hello", words: [...] }
```

---

## 二、整词慢速朗读（问题2）

### 2.1 移除朗读方式选择

- 设置页移除"朗读方式"下拉框（`set-mode`）
- `state.settings` 移除 `mode` 和 `charInterval` 字段

### 2.2 TTS改造

- **移除** `speakCharByChar` 函数及所有逐字朗读相关代码
- **移除** `charTimers` 数组
- **移除** `mode` 参数逻辑，`speak()` 只走整词朗读路径
- **rate 默认值**从 1.0 改为 **0.5**（语速放慢一半）
- **rate 下限**从 0.8 放宽到 **0.3**
- 保留 `repeat`（重复次数）、`interval`（重复间隔500ms）、`stop/pause/resume` 等功能

---

## 三、词语间隔修复（问题3）

### 3.1 根因分析

当前流程：TTS播完 → 等待家长点击"正确/错误" → `markWord()` 才启动Timer → 间隔后播下一词。

问题：如果家长不点击，间隔永远不生效。且新流程移除了对错标记，必须自动触发间隔。

### 3.2 修复方案

新流程：TTS播完 → 自动启动 `Timer.start(state.settings.interval, ...)` → 倒计时显示 → 倒计时结束 → 自动播下一词。

```javascript
// playCurrentWord() 的 TTS onEnd 回调
function onTTSComplete() {
  state.dictation.currentIndex++;
  if (state.dictation.currentIndex >= state.dictation.words.length) {
    finishDictation();  // 全部播完
  } else {
    updateDictationUI();
    Timer.start(state.settings.interval, function(remaining) {
      setText('timer-display', remaining + '秒');
    }, function() {
      setText('timer-display', '');
      playCurrentWord();  // 自动播下一词
    });
  }
}
```

---

## 四、打印纸仅显示横线（问题4）

### 4.1 空白卷（默认预览/打印）

- 每个词语只对应一条空白横线，**不显示词语文字和拼音**
- 横线长度根据词语字数动态计算
- 语文：2字词 → 约60px，3字词 → 约80px，4字词 → 约100px，每增加1字加约20px
- 英语：按单词字母数估算，每个字母约8px

### 4.2 HTML结构

```html
<div class="practice-line">
  <span class="line-blank" style="width: 80px;">________</span>
</div>
```

---

## 五、A4格式多词一行打印（问题5）

### 5.1 排版规格

- **纸张**：A4竖向（210mm × 297mm）
- **边距**：上下20mm、左右15mm
- **有效宽度**：210 - 15×2 = 180mm ≈ 680px（96dpi）
- **页眉**：学科 + 课文名称 + 日期，居中，下方双线分隔
- **每行排列**：使用 `flex-wrap` 自动换行，多个词语+横线横向排列
- **词语间距**：约20px
- **行间距**：约32px（含横线下方留白供书写）
- **自动分页**：每页约25-30个词语

### 5.2 CSS实现

```css
.practice-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: baseline;
}

.practice-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.line-blank {
  border-bottom: 1px solid #333;
  display: inline-block;
  height: 28px;
}
```

### 5.3 @media print适配

```css
@media print {
  @page { size: A4 portrait; margin: 20mm 15mm; }
  body * { visibility: hidden; }
  #preview-content, #preview-content * { visibility: visible; }
  #preview-content { position: absolute; left: 0; top: 0; width: 100%; }
  .practice-grid { gap: 12px 24px; }
  .practice-item { page-break-inside: avoid; }
}
```

---

## 六、自动播报+答案查看（问题6）

### 6.1 听写流程重构

**旧流程**：播一词 → 等家长标记对错 → 间隔 → 下一词 → 全部完成 → 结果页（分数+错词列表）

**新流程**：自动播完全部词语 → 结果页（播报完成提示） → 点击"查看答案" → 答案页

### 6.2 听写进行页UI变更

- **移除**："正确/错误"按钮（`btn-correct`/`btn-wrong`）
- **移除**：对错统计区（`dictation-correct-count`/`dictation-wrong-count`）
- **保留**：进度条、进度文字、暂停/继续按钮、重播按钮、倒计时显示
- **新增**：当前播放状态提示文字（"正在播放第 X 题..."）

### 6.3 结果页重构

**移除**：分数显示、对错统计、错误词语列表

**新增**：
- 播报完成提示："听写播报完成，共 X 个词语"
- "查看答案"按钮 → 跳转答案页
- "返回首页"按钮
- "再听一次"按钮

### 6.4 答案页（新增 page-answer）

- 版式与A4打印纸完全一致（多词一行、flex-wrap布局）
- 横线上方显示词语文字
- 语文：词语下方显示拼音
- 英语：单词下方显示中文释义
- "打印答案"按钮
- "返回首页"按钮

### 6.5 历史记录调整

- 不再记录对错数量和分数
- 记录内容：日期、学科、课文名称、词语总数
- 移除 `wrongWords` 字段

### 6.6 错题本调整

- 听写流程不再自动写入错题本（因为没有对错标记）
- 错题本数据结构和UI保留，可后续扩展为手动添加功能

---

## 七、文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `SPEC_v3.md` | 新增 | 本规格文档 |
| `js/data.js` | 重构 | 词库从unit改为lesson按课组织 |
| `js/tts.js` | 简化 | 移除逐字朗读、rate默认0.5、放宽下限 |
| `js/app.js` | 重构 | 自动播报流程、答案页逻辑、打印新版式、移除对错逻辑 |
| `js/history.js` | 修改 | 记录结构调整（无对错，改为词语数量） |
| `js/timer.js` | 不变 | 逻辑不变 |
| `js/wronglist.js` | 不变 | 数据结构保留，听写流程不再自动写入 |
| `index.html` | 重构 | 移除朗读方式选择、移除对错按钮、新增答案页 |
| `css/style.css` | 重构 | A4多词一行打印排版、答案页样式、移除对错按钮样式 |

---

## 八、测试验证要求

完成修改后，必须验证以下场景：

1. 设置页"选择课文"正确显示按课组织的词语列表
2. 不再有"朗读方式"选择项
3. 整词朗读语速明显放慢（约为正常语速的一半）
4. 词语间隔设置（2/3/5/8秒）在每词播完后准确生效
5. 预览页只显示空白横线，不显示词语和拼音
6. 打印纸按A4格式排版，一行放多个词语的横线
7. 开始听写后自动顺序播报，无需手动确认
8. 播报完成后可点击"查看答案"
9. 答案页版式与打印纸一致，但显示词语文字
10. 暂停/继续功能正常
11. 历史记录正确保存
