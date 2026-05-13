/**
 * 导入默认课本词库到数据库
 */

const VOCAB = {
  chinese: {
    grade2_semester1: {
      lesson1: { name: "第1课 小蝌蚪找妈妈", words: [{ text: "池塘", pinyin: "chí táng" }, { text: "眼睛", pinyin: "yǎn jing" }, { text: "露出", pinyin: "lù chū" }, { text: "鼓着", pinyin: "gǔ zhe" }, { text: "肚皮", pinyin: "dù pí" }, { text: "孩子", pinyin: "hái zi" }, { text: "已经", pinyin: "yǐ jing" }, { text: "变化", pinyin: "biàn huà" }] },
      lesson2: { name: "第2课 我是什么", words: [{ text: "极小", pinyin: "jí xiǎo" }, { text: "大片", pinyin: "dà piàn" }, { text: "傍晚", pinyin: "bàng wǎn" }, { text: "海洋", pinyin: "hǎi yáng" }, { text: "工作", pinyin: "gōng zuò" }, { text: "送给", pinyin: "sòng gěi" }, { text: "带来", pinyin: "dài lái" }, { text: "办法", pinyin: "bàn fǎ" }] },
      lesson3: { name: "第3课 植物妈妈有办法", words: [{ text: "如果", pinyin: "rú guǒ" }, { text: "告别", pinyin: "gào bié" }, { text: "旅行", pinyin: "lǚ xíng" }, { text: "准备", pinyin: "zhǔn bèi" }, { text: "植物", pinyin: "zhí wù" }, { text: "观察", pinyin: "guān chá" }, { text: "知识", pinyin: "zhī shi" }, { text: "粗心", pinyin: "cū xīn" }, { text: "得到", pinyin: "dé dào" }] },
      lesson4: { name: "第4课 曹冲称象", words: [{ text: "花园", pinyin: "huā yuán" }, { text: "石桥", pinyin: "shí qiáo" }, { text: "队旗", pinyin: "duì qí" }, { text: "铜号", pinyin: "tóng hào" }, { text: "红领巾", pinyin: "hóng lǐng jīn" }, { text: "欢笑", pinyin: "huān xiào" }] },
      lesson5: { name: "第5课 玲玲的画", words: [{ text: "杨树", pinyin: "yáng shù" }, { text: "梧桐", pinyin: "wú tóng" }, { text: "松柏", pinyin: "sōng bǎi" }, { text: "木棉", pinyin: "mù mián" }, { text: "化石", pinyin: "huà shí" }, { text: "金桂", pinyin: "jīn guì" }, { text: "唱歌", pinyin: "chàng gē" }, { text: "丰收", pinyin: "fēng shōu" }] },
      lesson6: { name: "第6课 一封信", words: [{ text: "朋友", pinyin: "péng you" }, { text: "四季", pinyin: "sì jì" }, { text: "农事", pinyin: "nóng shì" }, { text: "月光", pinyin: "yuè guāng" }, { text: "秋季", pinyin: "qiū jì" }, { text: "身体", pinyin: "shēn tǐ" }, { text: "辛苦", pinyin: "xīn kǔ" }, { text: "穿衣", pinyin: "chuān yī" }, { text: "变成", pinyin: "biàn chéng" }, { text: "来到", pinyin: "lái dào" }] },
      lesson7: { name: "第7课 妈妈睡了", words: [{ text: "叔叔", pinyin: "shū shu" }, { text: "脚尖", pinyin: "jiǎo jiān" }, { text: "快乐", pinyin: "kuài lè" }, { text: "招呼", pinyin: "zhāo hu" }, { text: "怎么", pinyin: "zěn me" }, { text: "做梦", pinyin: "zuò mèng" }] },
      lesson8: { name: "第8课 古诗二首", words: [{ text: "楼", pinyin: "lóu" }, { text: "依", pinyin: "yī" }, { text: "尽", pinyin: "jìn" }, { text: "黄", pinyin: "huáng" }, { text: "层", pinyin: "céng" }, { text: "照", pinyin: "zhào" }, { text: "炉", pinyin: "lú" }, { text: "烟", pinyin: "yān" }, { text: "挂", pinyin: "guà" }, { text: "川", pinyin: "chuān" }] },
      lesson9: { name: "第9课 黄山奇石", words: [{ text: "南部", pinyin: "nán bù" }, { text: "那些", pinyin: "nà xiē" }, { text: "山顶", pinyin: "shān dǐng" }, { text: "一动不动", pinyin: "yí dòng bú dòng" }, { text: "云海", pinyin: "yún hǎi" }, { text: "前方", pinyin: "qián fāng" }, { text: "每当", pinyin: "měi dāng" }, { text: "金光闪闪", pinyin: "jīn guāng shǎn shǎn" }, { text: "它们", pinyin: "tā men" }] }
    }
  }
};

async function importVocab() {
  const baseUrl = 'http://localhost:3000';
  let count = 0;

  console.log('开始导入默认词库...\n');

  for (const [subject, grades] of Object.entries(VOCAB)) {
    for (const [grade, lessons] of Object.entries(grades)) {
      for (const [key, lesson] of Object.entries(lessons)) {
        try {
          const res = await fetch(`${baseUrl}/api/builtin/${subject}/${grade}/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: lesson.name,
              vocabType: 'word',
              words: lesson.words,
              knowledgePoints: []
            })
          });
          if (res.ok) {
            console.log(`✓ ${lesson.name}`);
            count++;
          } else {
            console.log(`✗ ${lesson.name}: ${res.status}`);
          }
        } catch (e) {
          console.log(`✗ ${lesson.name}: ${e.message}`);
        }
      }
    }
  }

  console.log(`\n导入完成！共 ${count} 课`);
  console.log('刷新页面即可看到课文列表');
}

importVocab();
