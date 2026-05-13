/**
 * 导入默认课本词库到数据库
 * 从 data.js 的 VOCAB 对象读取并导入
 */

const fs = require('fs');
const path = require('path');

// 读取 data.js 文件内容
const dataJsPath = path.join(__dirname, 'js', 'data.js');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf-8');

// 提取 VOCAB 对象（简单解析）
const vocabMatch = dataJsContent.match(/const VOCAB = ({[\s\S]*?});\s*\/\*\*\s*\* 自定义词库/);
if (!vocabMatch) {
  console.error('无法找到 VOCAB 对象');
  process.exit(1);
}

// 使用 Function 构造器安全地解析对象
let VOCAB;
try {
  VOCAB = eval('(' + vocabMatch[1] + ')');
} catch (e) {
  console.error('解析 VOCAB 失败:', e.message);
  process.exit(1);
}

console.log('找到默认词库数据:');
console.log('- 语文上册课文数:', Object.keys(VOCAB.chinese?.grade2_semester1 || {}).length);
console.log('- 语文下册课文数:', Object.keys(VOCAB.chinese?.grade2_semester2 || {}).length);

// 转换为 API 格式并导入
const importData = {
  chinese: {
    grade2_semester1: VOCAB.chinese?.grade2_semester1 || {},
    grade2_semester2: VOCAB.chinese?.grade2_semester2 || {}
  }
};

// 调用 API 导入
fetch('http://localhost:3000/api/builtin/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: importData })
})
.then(res => res.json())
.then(result => {
  if (result.success) {
    console.log('✅ 默认词库导入成功！');
    console.log('现在刷新页面即可看到二年级上册和下册的语文课文。');
  } else {
    console.error('导入失败:', result.message);
  }
})
.catch(err => {
  console.error('请求失败:', err.message);
  console.log('请确保服务器已启动: node server.js');
});
