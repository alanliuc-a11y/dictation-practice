# CodeBuddy 开发任务 - 第一阶段

## 任务目标
开发小学生听写练习系统的**第一阶段**功能，包含：
1. 播放引擎（Web Speech API）
2. 时间控制器
3. 听写完整流程（语文二年级上册）
4. 静态 UI 框架
5. 结果展示 + 错题记录

## 项目位置
`c:\Users\Administrator\Desktop\听写练习系统`

设计文档：`SPEC.md`（已在此目录下）

## 开发要求

### 文件结构
```
听写练习系统/
├── index.html          # 单页应用入口
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主程序、页面路由、状态管理
│   ├── tts.js          # 语音播放引擎（⭐核心）
│   ├── timer.js        # 时间控制器（⭐核心）
│   ├── data.js         # 词库数据
│   ├── wronglist.js    # 错题本管理
│   ├── history.js      # 历史记录
│   └── printer.js      # 打印卷生成
└── SPEC.md
```

### 核心模块说明

**tts.js - 语音播放引擎**：
- 使用 Web Speech API（`speechSynthesis`）
- 支持配置：播放次数（1~3）、语速（0.8~1.2）、音调
- 导出函数：`speak(text, options)`、`stop()`、`pause()`、`resume()`
- 如果浏览器不支持 TTS，回退到静默模式（显示词语但不播放）

**timer.js - 时间控制器**：
- 精确控制每词之间的停顿时间
- 支持：开始、暂停、重置
- 倒计时显示（用于 UI 展示剩余时间）
- 导出函数：`start(seconds, callback)`、`pause()`、`reset()`

**data.js - 词库数据**：
语文二年级上册词语（示例格式如下，实际包含全部已获取词语）：

```javascript
const VOCAB = {
  chinese: {
    grade2_semester1: {
      unit1: { name: "第一单元", words: [
        { text: "欢迎", pinyin: "huān yíng" },
        { text: "祖国", pinyin: "zǔ guó" }
      ]},
      unit2: { name: "第二单元", words: [
        { text: "小学", pinyin: "xiǎo xué" }
      ]}
      // ... 继续补充所有已获取的单元
    }
  },
  english: { grade2: {} }  // 英语词库后续扩展
};
```

**app.js - 主程序**：
- 实现 SPA 路由（通过 hash 或页面切换 div）
- 页面：首页、听写设置页、听写进行页、结果页、错题本页、历史页
- 听写进行页逻辑：
  1. 从词库读取当前词语
  2. 调用 tts.speak() 播放
  3. 显示"✅正确"和"❌错误"两个大按钮
  4. 家长点击后记录结果
  5. 等待 timer 倒计时后播放下一个
  6. 所有词语完成后跳转到结果页

**wronglist.js**：
- localStorage key: `wronglist`
- 函数：`addMistake(word)`、`getMistakes()`、`removeMistake(id)`、`clearMistakes()`

**history.js**：
- localStorage key: `history`
- 函数：`addRecord(record)`、`getHistory()`、`clearHistory()`

**printer.js**：
- 生成打印视图（CSS @media print）
- 支持：空白听写卷（只印词语）、答案卷（印词语+拼音+答案）

### UI 设计要求
- 简洁亲子风格，主色调柔和蓝色 (#4A90D9)
- 大按钮、高对比度，适合手机/平板使用
- 响应式布局，支持横屏和竖屏

### 本阶段不要求
- 英语词库（第二阶段）
- 打印卷（第二阶段）
- 历史记录页面（第二阶段）

## 执行步骤
1. 创建目录结构（css/, js/）
2. 实现 tts.js（语音引擎）
3. 实现 timer.js（计时器）
4. 实现 data.js（词库 + 示例语文二年级上册词语）
5. 实现 wronglist.js 和 history.js
6. 实现 app.js（完整听写流程）
7. 创建 index.html（入口页面）
8. 创建 css/style.css（样式）
9. 在浏览器中测试确认功能正常

## 测试方法
完成后，在浏览器中打开 index.html，执行一次完整听写流程（至少5个词语），确认：
- 语音能正常播放
- 计时器正常工作
- 错误词语被记录
- 结果页正常显示
