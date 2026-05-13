# CodeBuddy 任务 - 移动端 UI 规范核查

## 任务目标
根据 `SPEC.md` 第9节"移动端 UI 规范"，核查并修复 `css/style.css` 中的实现。

## 项目路径
`c:\Users\Administrator\Desktop\听写练习系统`

## 任务内容

### 1. 核查以下规范是否在 style.css 中已实现

请对照 SPEC.md 第9节逐条检查：

**触控体验**：
- [ ] 所有按钮/可点击元素高度 ≥ 44px
- [ ] 按钮禁止文字选中：`-webkit-user-select: none; user-select: none`
- [ ] 图片禁止拖拽：`img { pointer-events: none; }`
- [ ] 点击反馈：`btn:active { transform: scale(0.95~0.98); }`

**iOS 适配**：
- [ ] `body { overscroll-behavior: none; }` 防止下拉刷新冲突
- [ ] iOS 安全区域变量：`--safe-bottom: env(safe-area-inset-bottom, 0px)`（已存在）

**弹性滚动**：
- [ ] 长列表（历史记录、错题列表）支持惯性滚动：`overflow-y: auto; -webkit-overflow-scrolling: touch;`

**字号规范**：
- [ ] 主按钮文字 ≥ 20px（横屏 ≥ 18px）
- [ ] 标题/分数 ≥ 36px（横屏 ≥ 28px）

### 2. 如有缺失，补充到 style.css

找到缺失项后直接在 style.css 中添加对应样式。

### 3. 验证

确认 style.css 中：
- 无 `var()` 引用了但未定义的变量
- 无废弃的 CSS 属性
- 响应式断点覆盖完整

## 执行方式
- 用 `/model glm-5.1` 确认使用 GLM-5.1 模型
- 直接读取和修改 `c:\Users\Administrator\Desktop\听写练习系统\css\style.css`
- 完成后汇报修改了哪些行
