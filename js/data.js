/**
 * data.js - 词库数据管理（改进版）
 * 改进内容：
 * 1. 升级ES6+语法
 * 2. 添加输入验证和XSS防护
 * 3. 增强错误处理
 * 4. 优化代码结构
 */

const VOCAB = {
  chinese: {
    grade2_semester1: {
      lesson1: {
        name: "第1课 小蝌蚪找妈妈",
        words: [
          { text: "池塘", pinyin: "chí táng" },
          { text: "眼睛", pinyin: "yǎn jing" },
          { text: "露出", pinyin: "lù chū" },
          { text: "鼓着", pinyin: "gǔ zhe" },
          { text: "肚皮", pinyin: "dù pí" },
          { text: "孩子", pinyin: "hái zi" },
          { text: "已经", pinyin: "yǐ jing" },
          { text: "变化", pinyin: "biàn huà" }
        ]
      },
      lesson2: {
        name: "第2课 我是什么",
        words: [
          { text: "极小", pinyin: "jí xiǎo" },
          { text: "大片", pinyin: "dà piàn" },
          { text: "傍晚", pinyin: "bàng wǎn" },
          { text: "海洋", pinyin: "hǎi yáng" },
          { text: "工作", pinyin: "gōng zuò" },
          { text: "送给", pinyin: "sòng gěi" },
          { text: "带来", pinyin: "dài lái" },
          { text: "办法", pinyin: "bàn fǎ" }
        ]
      },
      lesson3: {
        name: "第3课 植物妈妈有办法",
        words: [
          { text: "如果", pinyin: "rú guǒ" },
          { text: "告别", pinyin: "gào bié" },
          { text: "旅行", pinyin: "lǚ xíng" },
          { text: "准备", pinyin: "zhǔn bèi" },
          { text: "植物", pinyin: "zhí wù" },
          { text: "观察", pinyin: "guān chá" },
          { text: "知识", pinyin: "zhī shi" },
          { text: "粗心", pinyin: "cū xīn" },
          { text: "得到", pinyin: "dé dào" }
        ]
      },
      lesson4: {
        name: "第4课 曹冲称象",
        words: [
          { text: "花园", pinyin: "huā yuán" },
          { text: "石桥", pinyin: "shí qiáo" },
          { text: "队旗", pinyin: "duì qí" },
          { text: "铜号", pinyin: "tóng hào" },
          { text: "红领巾", pinyin: "hóng lǐng jīn" },
          { text: "欢笑", pinyin: "huān xiào" }
        ]
      },
      lesson5: {
        name: "第5课 玲玲的画",
        words: [
          { text: "杨树", pinyin: "yáng shù" },
          { text: "梧桐", pinyin: "wú tóng" },
          { text: "松柏", pinyin: "sōng bǎi" },
          { text: "木棉", pinyin: "mù mián" },
          { text: "化石", pinyin: "huà shí" },
          { text: "金桂", pinyin: "jīn guì" },
          { text: "唱歌", pinyin: "chàng gē" },
          { text: "丰收", pinyin: "fēng shōu" }
        ]
      },
      lesson6: {
        name: "第6课 一封信",
        words: [
          { text: "朋友", pinyin: "péng you" },
          { text: "四季", pinyin: "sì jì" },
          { text: "农事", pinyin: "nóng shì" },
          { text: "月光", pinyin: "yuè guāng" },
          { text: "秋季", pinyin: "qiū jì" },
          { text: "身体", pinyin: "shēn tǐ" },
          { text: "辛苦", pinyin: "xīn kǔ" },
          { text: "穿衣", pinyin: "chuān yī" },
          { text: "变成", pinyin: "biàn chéng" },
          { text: "来到", pinyin: "lái dào" }
        ]
      },
      lesson7: {
        name: "第7课 妈妈睡了",
        words: [
          { text: "叔叔", pinyin: "shū shu" },
          { text: "脚尖", pinyin: "jiǎo jiān" },
          { text: "快乐", pinyin: "kuài lè" },
          { text: "招呼", pinyin: "zhāo hu" },
          { text: "怎么", pinyin: "zěn me" },
          { text: "做梦", pinyin: "zuò mèng" },
          { text: "有趣", pinyin: "yǒu qù" },
          { text: "故事", pinyin: "gù shi" }
        ]
      },
      lesson8: {
        name: "第8课 古诗二首",
        words: [
          { text: "睡觉", pinyin: "shuì jiào" },
          { text: "地方", pinyin: "dì fang" },
          { text: "告诉", pinyin: "gào su" },
          { text: "发现", pinyin: "fā xiàn" },
          { text: "唱歌", pinyin: "chàng gē" },
          { text: "画画", pinyin: "huà huà" }
        ]
      },
      lesson9: {
        name: "第9课 黄山奇石",
        words: [
          { text: "学校", pinyin: "xué xiào" },
          { text: "班级", pinyin: "bān jí" },
          { text: "同学", pinyin: "tóng xué" },
          { text: "老师", pinyin: "lǎo shī" },
          { text: "作业", pinyin: "zuò yè" },
          { text: "故事书", pinyin: "gù shi shū" },
          { text: "铅笔", pinyin: "qiān bǐ" },
          { text: "橡皮", pinyin: "xiàng pí" },
          { text: "书包", pinyin: "shū bāo" },
          { text: "尺子", pinyin: "chǐ zi" }
        ]
      }
    },
    grade2_semester2: {
      // ===== 部编版二年级下册 =====
      // 第一单元
      s2_lesson1: {
        name: "第1课 古诗二首（村居·咏柳）",
        words: [
          { text: "村庄", pinyin: "cūn zhuāng" },
          { text: "居所", pinyin: "jū suǒ" },
          { text: "咏柳", pinyin: "yǒng liǔ" },
          { text: "碧玉", pinyin: "bì yù" },
          { text: "化妆", pinyin: "huà zhuāng" },
          { text: "丝绦", pinyin: "sī tāo" },
          { text: "裁剪", pinyin: "cái jiǎn" }
        ],
        vocabType: "poem"
      },
      s2_lesson2: {
        name: "第2课 找春天",
        words: [
          { text: "春天", pinyin: "chūn tiān" },
          { text: "寻找", pinyin: "xún zhǎo" },
          { text: "姑娘", pinyin: "gū niang" },
          { text: "野花", pinyin: "yě huā" },
          { text: "眼睛", pinyin: "yǎn jing" },
          { text: "柳枝", pinyin: "liǔ zhī" },
          { text: "桃花", pinyin: "táo huā" },
          { text: "杏花", pinyin: "xìng huā" },
          { text: "鲜花", pinyin: "xiān huā" },
          { text: "遮遮掩掩", pinyin: "zhē zhē yǎn yǎn" },
          { text: "躲躲藏藏", pinyin: "duǒ duǒ cáng cáng" },
          { text: "叮叮咚咚", pinyin: "dīng dīng dōng dōng" }
        ]
      },
      s2_lesson3: {
        name: "第3课 开满鲜花的小路",
        words: [
          { text: "鲜花", pinyin: "xiān huā" },
          { text: "邮递员", pinyin: "yóu dì yuán" },
          { text: "先生", pinyin: "xiān sheng" },
          { text: "原来", pinyin: "yuán lái" },
          { text: "大叔", pinyin: "dà shū" },
          { text: "邮局", pinyin: "yóu jú" },
          { text: "太太", pinyin: "tài tai" },
          { text: "做客", pinyin: "zuò kè" },
          { text: "惊奇", pinyin: "jīng qí" },
          { text: "快活", pinyin: "kuài huo" },
          { text: "美好", pinyin: "měi hǎo" },
          { text: "礼物", pinyin: "lǐ wù" }
        ]
      },
      s2_lesson4: {
        name: "第4课 邓小平爷爷植树",
        words: [
          { text: "植树", pinyin: "zhí shù" },
          { text: "碧空如洗", pinyin: "bì kōng rú xǐ" },
          { text: "万里无云", pinyin: "wàn lǐ wú yún" },
          { text: "公园", pinyin: "gōng yuán" },
          { text: "格外", pinyin: "gé wài" },
          { text: "引人注目", pinyin: "yǐn rén zhù mù" },
          { text: "汗珠", pinyin: "hàn zhū" },
          { text: "休息", pinyin: "xiū xi" },
          { text: "柏树", pinyin: "bǎi shù" },
          { text: "树苗", pinyin: "shù miáo" },
          { text: "小心", pinyin: "xiǎo xīn" },
          { text: "笔直", pinyin: "bǐ zhí" }
        ]
      },
      // 第二单元
      s2_lesson5: {
        name: "第5课 雷锋叔叔，你在哪里",
        words: [
          { text: "叔叔", pinyin: "shū shu" },
          { text: "足迹", pinyin: "zú jì" },
          { text: "昨天", pinyin: "zuó tiān" },
          { text: "迷路", pinyin: "mí lù" },
          { text: "温暖", pinyin: "wēn nuǎn" },
          { text: "爱心", pinyin: "ài xīn" },
          { text: "到处", pinyin: "dào chù" },
          { text: "年迈", pinyin: "nián mài" },
          { text: "洒下", pinyin: "sǎ xià" },
          { text: "泥泞", pinyin: "ní nìng" },
          { text: "晶莹", pinyin: "jīng yíng" },
          { text: "寻觅", pinyin: "xún mì" }
        ]
      },
      s2_lesson6: {
        name: "第6课 千人糕",
        words: [
          { text: "一定", pinyin: "yí dìng" },
          { text: "也许", pinyin: "yě xǔ" },
          { text: "桌子", pinyin: "zhuō zi" },
          { text: "平时", pinyin: "píng shí" },
          { text: "难道", pinyin: "nán dào" },
          { text: "味道", pinyin: "wèi dào" },
          { text: "就是", pinyin: "jiù shì" },
          { text: "加工", pinyin: "jiā gōng" },
          { text: "农具", pinyin: "nóng jù" },
          { text: "甜菜", pinyin: "tián cài" },
          { text: "工具", pinyin: "gōng jù" },
          { text: "劳动", pinyin: "láo dòng" },
          { text: "经过", pinyin: "jīng guò" },
          { text: "出色", pinyin: "chū sè" }
        ]
      },
      s2_lesson7: {
        name: "第7课 一匹出色的马",
        words: [
          { text: "出色", pinyin: "chū sè" },
          { text: "河水", pinyin: "hé shuǐ" },
          { text: "碧绿", pinyin: "bì lǜ" },
          { text: "波纹", pinyin: "bō wén" },
          { text: "河岸", pinyin: "hé àn" },
          { text: "柳叶", pinyin: "liǔ yè" },
          { text: "景色", pinyin: "jǐng sè" },
          { text: "恋恋不舍", pinyin: "liàn liàn bù shě" },
          { text: "柳树枝条", pinyin: "liǔ shù zhī tiáo" },
          { text: "柔软", pinyin: "róu ruǎn" },
          { text: "郊外", pinyin: "jiāo wài" },
          { text: "跨上", pinyin: "kuà shàng" }
        ]
      },
      // 第三单元（识字）
      s2_lesson8: {
        name: "识字1 神州谣",
        words: [
          { text: "神州", pinyin: "shén zhōu" },
          { text: "中华", pinyin: "zhōng huá" },
          { text: "山川", pinyin: "shān chuān" },
          { text: "黄河", pinyin: "huáng hé" },
          { text: "长江", pinyin: "cháng jiāng" },
          { text: "长城", pinyin: "cháng chéng" },
          { text: "台湾", pinyin: "tái wān" },
          { text: "海峡", pinyin: "hǎi xiá" },
          { text: "民族", pinyin: "mín zú" },
          { text: "奋发", pinyin: "fèn fā" },
          { text: "繁荣", pinyin: "fán róng" }
        ]
      },
      s2_lesson9: {
        name: "识字2 传统节日",
        words: [
          { text: "节日", pinyin: "jié rì" },
          { text: "春节", pinyin: "chūn jié" },
          { text: "花灯", pinyin: "huā dēng" },
          { text: "清明节", pinyin: "qīng míng jié" },
          { text: "先人", pinyin: "xiān rén" },
          { text: "龙舟", pinyin: "lóng zhōu" },
          { text: "中秋", pinyin: "zhōng qiū" },
          { text: "圆月", pinyin: "yuán yuè" },
          { text: "转眼", pinyin: "zhuǎn yǎn" },
          { text: "团圆", pinyin: "tuán yuán" },
          { text: "热闹", pinyin: "rè nao" },
          { text: "月饼", pinyin: "yuè bǐng" }
        ]
      },
      s2_lesson10: {
        name: "识字3 '贝'的故事",
        words: [
          { text: "动物", pinyin: "dòng wù" },
          { text: "贝壳", pinyin: "bèi ké" },
          { text: "甲骨文", pinyin: "jiǎ gǔ wén" },
          { text: "张开", pinyin: "zhāng kāi" },
          { text: "样子", pinyin: "yàng zi" },
          { text: "可以", pinyin: "kě yǐ" },
          { text: "钱币", pinyin: "qián bì" },
          { text: "钱财", pinyin: "qián cái" },
          { text: "有关", pinyin: "yǒu guān" },
          { text: "珍贵", pinyin: "zhēn guì" },
          { text: "保护", pinyin: "bǎo hù" },
          { text: "损坏", pinyin: "sǔn huài" }
        ]
      },
      s2_lesson11: {
        name: "识字4 中国美食",
        words: [
          { text: "美食", pinyin: "měi shí" },
          { text: "红烧", pinyin: "hóng shāo" },
          { text: "茄子", pinyin: "qié zi" },
          { text: "烤鸭", pinyin: "kǎo yā" },
          { text: "羊肉", pinyin: "yáng ròu" },
          { text: "蛋炒饭", pinyin: "dàn chǎo fàn" },
          { text: "小鸡炖蘑菇", pinyin: "xiǎo jī dùn mó gu" },
          { text: "蒸饺", pinyin: "zhēng jiǎo" },
          { text: "炸酱面", pinyin: "zhá jiàng miàn" },
          { text: "粥", pinyin: "zhōu" },
          { text: "豆腐", pinyin: "dòu fu" },
          { text: "菠菜", pinyin: "bō cài" }
        ]
      },
      // 第四单元
      s2_lesson12: {
        name: "第8课 彩色的梦",
        words: [
          { text: "彩色", pinyin: "cǎi sè" },
          { text: "脚尖", pinyin: "jiǎo jiān" },
          { text: "森林", pinyin: "sēn lín" },
          { text: "雪松", pinyin: "xuě sōng" },
          { text: "歌声", pinyin: "gē shēng" },
          { text: "苹果", pinyin: "píng guǒ" },
          { text: "精灵", pinyin: "jīng líng" },
          { text: "季节", pinyin: "jì jié" },
          { text: "梦境", pinyin: "mèng jìng" },
          { text: "草坪", pinyin: "cǎo píng" },
          { text: "葱郁", pinyin: "cōng yù" },
          { text: "烟囱", pinyin: "yān cōng" }
        ]
      },
      s2_lesson13: {
        name: "第9课 枫树上的喜鹊",
        words: [
          { text: "喜欢", pinyin: "xǐ huan" },
          { text: "好像", pinyin: "hǎo xiàng" },
          { text: "说话", pinyin: "shuō huà" },
          { text: "童话", pinyin: "tóng huà" },
          { text: "阿姨", pinyin: "ā yí" },
          { text: "对岸", pinyin: "duì àn" },
          { text: "弟弟", pinyin: "dì di" },
          { text: "游戏", pinyin: "yóu xì" },
          { text: "发明", pinyin: "fā míng" },
          { text: "字母", pinyin: "zì mǔ" },
          { text: "拼音", pinyin: "pīn yīn" },
          { text: "太阳伞", pinyin: "tài yáng sǎn" },
          { text: "教", pinyin: "jiāo" },
          { text: "渡", pinyin: "dù" },
          { text: "遮", pinyin: "zhē" }
        ]
      },
      s2_lesson14: {
        name: "第10课 沙滩上的童话",
        words: [
          { text: "周围", pinyin: "zhōu wéi" },
          { text: "补充", pinyin: "bǔ chōng" },
          { text: "公主", pinyin: "gōng zhǔ" },
          { text: "勇士", pinyin: "yǒng shì" },
          { text: "飞机", pinyin: "fēi jī" },
          { text: "地道", pinyin: "dì dào" },
          { text: "火药", pinyin: "huǒ yào" },
          { text: "胜利", pinyin: "shèng lì" },
          { text: "叫喊", pinyin: "jiào hǎn" },
          { text: "忘记", pinyin: "wàng jì" },
          { text: "凶狠", pinyin: "xiōng hěn" },
          { text: "商量", pinyin: "shāng liang" }
        ]
      },
      s2_lesson15: {
        name: "第11课 我是一只小虫子",
        words: [
          { text: "屁股", pinyin: "pì gu" },
          { text: "苍耳", pinyin: "cāng ěr" },
          { text: "留神", pinyin: "liú shén" },
          { text: "干净", pinyin: "gān jìng" },
          { text: "从来", pinyin: "cóng lái" },
          { text: "幸运", pinyin: "xìng yùn" },
          { text: "比如", pinyin: "bǐ rú" },
          { text: "使劲", pinyin: "shǐ jìn" },
          { text: "昏头昏脑", pinyin: "hūn tóu hūn nǎo" },
          { text: "毛茸茸", pinyin: "máo róng róng" },
          { text: "摇晃", pinyin: "yáo huàng" },
          { text: "触须", pinyin: "chù xū" }
        ]
      },
      // 第五单元
      s2_lesson16: {
        name: "第12课 寓言二则",
        words: [
          { text: "亡羊补牢", pinyin: "wáng yáng bǔ láo" },
          { text: "劝告", pinyin: "quàn gào" },
          { text: "筋疲力尽", pinyin: "jīn pí lì jìn" },
          { text: "明白", pinyin: "míng bai" },
          { text: "图画", pinyin: "tú huà" },
          { text: "老师", pinyin: "lǎo shī" },
          { text: "讲桌", pinyin: "jiǎng zhuō" },
          { text: "座位", pinyin: "zuò wèi" },
          { text: "哈哈大笑", pinyin: "hā hā dà xiào" },
          { text: "五角星", pinyin: "wǔ jiǎo xīng" },
          { text: "然后", pinyin: "rán hòu" },
          { text: "认真", pinyin: "rèn zhēn" },
          { text: "角度", pinyin: "jiǎo dù" },
          { text: "愿意", pinyin: "yuàn yì" }
        ]
      },
      s2_lesson17: {
        name: "第13课 画杨桃",
        words: [
          { text: "图画", pinyin: "tú huà" },
          { text: "老师", pinyin: "lǎo shī" },
          { text: "讲桌", pinyin: "jiǎng zhuō" },
          { text: "座位", pinyin: "zuò wèi" },
          { text: "哈哈大笑", pinyin: "hā hā dà xiào" },
          { text: "五角星", pinyin: "wǔ jiǎo xīng" },
          { text: "然后", pinyin: "rán hòu" },
          { text: "认真", pinyin: "rèn zhēn" },
          { text: "角度", pinyin: "jiǎo dù" },
          { text: "愿意", pinyin: "yuàn yì" },
          { text: "熟悉", pinyin: "shú xī" },
          { text: "审视", pinyin: "shěn shì" },
          { text: "半晌", pinyin: "bàn shǎng" },
          { text: "和颜悦色", pinyin: "hé yán yuè sè" }
        ]
      },
      s2_lesson18: {
        name: "第14课 小马过河",
        words: [
          { text: "麦子", pinyin: "mài zi" },
          { text: "为难", pinyin: "wéi nán" },
          { text: "身边", pinyin: "shēn biān" },
          { text: "四周", pinyin: "sì zhōu" },
          { text: "立刻", pinyin: "lì kè" },
          { text: "突然", pinyin: "tū rán" },
          { text: "吃惊", pinyin: "chī jīng" },
          { text: "认真", pinyin: "rèn zhēn" },
          { text: "脚步", pinyin: "jiǎo bù" },
          { text: "难为情", pinyin: "nán wéi qíng" },
          { text: "亲切", pinyin: "qīn qiè" },
          { text: "连蹦带跳", pinyin: "lián bèng dài tiào" }
        ]
      },
      // 第六单元
      s2_lesson19: {
        name: "第15课 古诗二首（晓出净慈寺送林子方·绝句）",
        words: [
          { text: "西湖", pinyin: "xī hú" },
          { text: "莲叶", pinyin: "lián yè" },
          { text: "无穷", pinyin: "wú qióng" },
          { text: "碧绿", pinyin: "bì lǜ" },
          { text: "绝句", pinyin: "jué jù" },
          { text: "黄鹂", pinyin: "huáng lí" },
          { text: "翠柳", pinyin: "cuì liǔ" },
          { text: "白鹭", pinyin: "bái lù" },
          { text: "东吴", pinyin: "dōng wú" },
          { text: "含", pinyin: "hán" },
          { text: "岭", pinyin: "lǐng" },
          { text: "泊", pinyin: "bó" }
        ],
        vocabType: "poem"
      },
      s2_lesson20: {
        name: "第16课 雷雨",
        words: [
          { text: "雷雨", pinyin: "léi yǔ" },
          { text: "乌云", pinyin: "wū yún" },
          { text: "闪电", pinyin: "shǎn diàn" },
          { text: "雷声", pinyin: "léi shēng" },
          { text: "房子", pinyin: "fáng zi" },
          { text: "窗户", pinyin: "chuāng hu" },
          { text: "垂下来", pinyin: "chuí xià lái" },
          { text: "迎面扑来", pinyin: "yíng miàn pū lái" },
          { text: "清新", pinyin: "qīng xīn" },
          { text: "越来越亮", pinyin: "yuè lái yuè liàng" },
          { text: "渐渐", pinyin: "jiàn jiàn" },
          { text: "黑沉沉", pinyin: "hēi chén chén" }
        ]
      },
      s2_lesson21: {
        name: "第17课 要是你在野外迷了路",
        words: [
          { text: "野外", pinyin: "yě wài" },
          { text: "大自然", pinyin: "dà zì rán" },
          { text: "天然", pinyin: "tiān rán" },
          { text: "指南针", pinyin: "zhǐ nán zhēn" },
          { text: "帮助", pinyin: "bāng zhù" },
          { text: "向导", pinyin: "xiàng dǎo" },
          { text: "指点", pinyin: "zhǐ diǎn" },
          { text: "北方", pinyin: "běi fāng" },
          { text: "北极星", pinyin: "běi jí xīng" },
          { text: "路灯", pinyin: "lù dēng" },
          { text: "永远", pinyin: "yǒng yuǎn" },
          { text: "黑夜", pinyin: "hēi yè" },
          { text: "特别", pinyin: "tè bié" },
          { text: "积雪", pinyin: "jī xuě" }
        ]
      },
      s2_lesson22: {
        name: "第18课 太空生活趣事多",
        words: [
          { text: "太空", pinyin: "tài kōng" },
          { text: "生活", pinyin: "shēng huó" },
          { text: "宇宙", pinyin: "yǔ zhòu" },
          { text: "飞船", pinyin: "fēi chuán" },
          { text: "别处", pinyin: "bié chù" },
          { text: "喝水", pinyin: "hē shuǐ" },
          { text: "杯子", pinyin: "bēi zi" },
          { text: "失去", pinyin: "shī qù" },
          { text: "使用", pinyin: "shǐ yòng" },
          { text: "半空", pinyin: "bàn kōng" },
          { text: "容易", pinyin: "róng yì" },
          { text: "浴室", pinyin: "yù shì" },
          { text: "方向", pinyin: "fāng xiàng" },
          { text: "安稳", pinyin: "ān wěn" }
        ]
      },
      // 第七单元
      s2_lesson23: {
        name: "第19课 大象的耳朵",
        words: [
          { text: "耳朵", pinyin: "ěr duo" },
          { text: "扇子", pinyin: "shàn zi" },
          { text: "遇到", pinyin: "yù dào" },
          { text: "兔子", pinyin: "tù zi" },
          { text: "后来", pinyin: "hòu lái" },
          { text: "不安", pinyin: "bù ān" },
          { text: "毛病", pinyin: "máo bìng" },
          { text: "头痛", pinyin: "tóu tòng" },
          { text: "最后", pinyin: "zuì hòu" },
          { text: "人家", pinyin: "rén jia" },
          { text: "耷拉", pinyin: "dā la" },
          { text: "竖着", pinyin: "shù zhe" }
        ]
      },
      s2_lesson24: {
        name: "第20课 蜘蛛开店",
        words: [
          { text: "飞虫", pinyin: "fēi chóng" },
          { text: "决定", pinyin: "jué dìng" },
          { text: "商店", pinyin: "shāng diàn" },
          { text: "木屋", pinyin: "mù wū" },
          { text: "功夫", pinyin: "gōng fu" },
          { text: "终于", pinyin: "zhōng yú" },
          { text: "围巾", pinyin: "wéi jīn" },
          { text: "星期", pinyin: "xīng qī" },
          { text: "编织", pinyin: "biān zhī" },
          { text: "口罩", pinyin: "kǒu zhào" },
          { text: "长颈鹿", pinyin: "cháng jǐng lù" },
          { text: "蜈蚣", pinyin: "wú gōng" }
        ]
      },
      s2_lesson25: {
        name: "第21课 青蛙卖泥塘",
        words: [
          { text: "青蛙", pinyin: "qīng wā" },
          { text: "草籽", pinyin: "cǎo zǐ" },
          { text: "野鸭", pinyin: "yě yā" },
          { text: "泉水", pinyin: "quán shuǐ" },
          { text: "竹子", pinyin: "zhú zi" },
          { text: "应该", pinyin: "yīng gāi" },
          { text: "花丛", pinyin: "huā cóng" },
          { text: "尽情", pinyin: "jìn qíng" },
          { text: "道路", pinyin: "dào lù" },
          { text: "吆喝", pinyin: "yāo he" },
          { text: "烂泥塘", pinyin: "làn ní táng" },
          { text: "舒服", pinyin: "shū fu" }
        ]
      },
      s2_lesson26: {
        name: "第22课 小毛虫",
        words: [
          { text: "毛虫", pinyin: "máo chóng" },
          { text: "叶子", pinyin: "yè zi" },
          { text: "目光", pinyin: "mù guāng" },
          { text: "周游", pinyin: "zhōu yóu" },
          { text: "纺织", pinyin: "fǎng zhī" },
          { text: "编织", pinyin: "biān zhī" },
          { text: "怎样", pinyin: "zěn yàng" },
          { text: "声音", pinyin: "shēng yīn" },
          { text: "花纹", pinyin: "huā wén" },
          { text: "消失", pinyin: "xiāo shī" },
          { text: "可怜", pinyin: "kě lián" },
          { text: "挪动", pinyin: "nuó dòng" },
          { text: "尽心竭力", pinyin: "jìn xīn jié lì" },
          { text: "与世隔绝", pinyin: "yǔ shì gé jué" }
        ]
      },
      // 第八单元
      s2_lesson27: {
        name: "第23课 祖先的摇篮",
        words: [
          { text: "祖先", pinyin: "zǔ xiān" },
          { text: "原始", pinyin: "yuán shǐ" },
          { text: "意思", pinyin: "yì si" },
          { text: "浓绿", pinyin: "nóng lǜ" },
          { text: "一望无际", pinyin: "yí wàng wú jì" },
          { text: "蓝天", pinyin: "lán tiān" },
          { text: "野果", pinyin: "yě guǒ" },
          { text: "野兔", pinyin: "yě tù" },
          { text: "赛跑", pinyin: "sài pǎo" },
          { text: "回忆", pinyin: "huí yì" },
          { text: "摘野果", pinyin: "zhāi yě guǒ" },
          { text: "逗小松鼠", pinyin: "dòu xiǎo sōng shǔ" }
        ]
      },
      s2_lesson28: {
        name: "第24课 当世界年纪还小的时候",
        words: [
          { text: "世界", pinyin: "shì jiè" },
          { text: "学习", pinyin: "xué xí" },
          { text: "成功", pinyin: "chéng gōng" },
          { text: "月亮", pinyin: "yuè liang" },
          { text: "主意", pinyin: "zhǔ yì" },
          { text: "一直", pinyin: "yì zhí" },
          { text: "只好", pinyin: "zhǐ hǎo" },
          { text: "反复", pinyin: "fǎn fù" },
          { text: "变化", pinyin: "biàn huà" },
          { text: "方式", pinyin: "fāng shì" },
          { text: "简单", pinyin: "jiǎn dān" },
          { text: "自由", pinyin: "zì yóu" },
          { text: "生长", pinyin: "shēng zhǎng" },
          { text: "泥土", pinyin: "ní tǔ" }
        ]
      },
      s2_lesson29: {
        name: "第25课 羿射九日",
        words: [
          { text: "光明", pinyin: "guāng míng" },
          { text: "觉得", pinyin: "jué de" },
          { text: "值日", pinyin: "zhí rì" },
          { text: "火球", pinyin: "huǒ qiú" },
          { text: "沙石", pinyin: "shā shí" },
          { text: "人类", pinyin: "rén lèi" },
          { text: "艰难", pinyin: "jiān nán" },
          { text: "决心", pinyin: "jué xīn" },
          { text: "炎热", pinyin: "yán rè" },
          { text: "害怕", pinyin: "hài pà" },
          { text: "从此", pinyin: "cóng cǐ" },
          { text: "重新", pinyin: "chóng xīn" },
          { text: "生机", pinyin: "shēng jī" },
          { text: "拉开", pinyin: "lā kāi" },
          { text: "神箭手", pinyin: "shén jiàn shǒu" },
          { text: "滋润", pinyin: "zī rùn" }
        ]
      }
    }
  },
  english: {
    grade2_semester1: {}
  },
  math: {
    grade2_semester1: {}
  }
};

/**
 * 安全工具
 */
const SecurityUtils = {
  /**
   * 验证词语数据
   * @param {Object} word - 词语对象
   * @returns {boolean}
   */
  validateWord(word) {
    if (!word || typeof word !== 'object') return false;
    if (!word.text || typeof word.text !== 'string') return false;
    if (word.text.length > 100) return false;
    
    // 检查危险字符
    const dangerousPattern = /<script|javascript:|on\w+=/i;
    if (dangerousPattern.test(word.text)) return false;
    if (word.pinyin && dangerousPattern.test(word.pinyin)) return false;
    if (word.meaning && dangerousPattern.test(word.meaning)) return false;
    
    return true;
  },

  /**
   * 清理文本输入
   * @param {string} text - 输入文本
   * @returns {string}
   */
  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.trim().replace(/[<>]/g, '').substring(0, 100);
  },

  /**
   * 生成安全ID
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

/**
 * 自定义词库管理
 */
const CustomVocab = (() => {
  'use strict';

  const STORAGE_KEY = 'custom_vocab_list';
  const MAX_VOCABS = 50; // 最大词库数量
  const MAX_WORDS_PER_VOCAB = 200; // 每个词库最大词语数

  /**
   * 获取所有自定义词库
   * @returns {Array}
   */
  const getAll = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const list = JSON.parse(data);
      if (!Array.isArray(list)) return [];
      
      // 验证每个词库
      return list.filter(item => {
        if (!item || !item.id || !item.name) return false;
        if (!Array.isArray(item.words)) return false;
        // 验证词语
        item.words = item.words.filter(SecurityUtils.validateWord);
        return item.words.length > 0;
      });
    } catch (error) {
      console.error('读取自定义词库失败:', error);
      return [];
    }
  };

  /**
   * 根据ID获取词库
   * @param {string} id - 词库ID
   * @returns {Object|null}
   */
  const getById = (id) => {
    if (!id || typeof id !== 'string') return null;
    
    const list = getAll();
    return list.find(item => item.id === id) || null;
  };

  /**
   * 保存词库
   * @param {Object} vocab - 词库对象
   * @returns {boolean}
   */
  const save = (vocab) => {
    try {
      // 验证词库数据
      if (!vocab || typeof vocab !== 'object') {
        throw new Error('无效的词库数据');
      }
      
      if (!vocab.id || typeof vocab.id !== 'string') {
        throw new Error('词库ID不能为空');
      }
      
      if (!vocab.name || typeof vocab.name !== 'string') {
        throw new Error('词库名称不能为空');
      }
      
      // 清理和验证名称
      vocab.name = SecurityUtils.sanitizeText(vocab.name);
      if (vocab.name.length === 0) {
        throw new Error('词库名称不能为空');
      }

      // 验证词语列表
      if (!Array.isArray(vocab.words)) {
        vocab.words = [];
      }
      
      // 清理和验证每个词语
      vocab.words = vocab.words.map(word => ({
        text: SecurityUtils.sanitizeText(word.text),
        pinyin: word.pinyin ? SecurityUtils.sanitizeText(word.pinyin) : undefined,
        meaning: word.meaning ? SecurityUtils.sanitizeText(word.meaning) : undefined
      })).filter(word => word.text.length > 0);

      // 限制词语数量
      if (vocab.words.length > MAX_WORDS_PER_VOCAB) {
        vocab.words = vocab.words.slice(0, MAX_WORDS_PER_VOCAB);
        console.warn(`词语数量超过限制，已截断至${MAX_WORDS_PER_VOCAB}个`);
      }

      if (vocab.words.length === 0) {
        throw new Error('词库至少需要包含一个词语');
      }

      // 获取现有列表
      const list = getAll();
      const index = list.findIndex(item => item.id === vocab.id);
      
      if (index >= 0) {
        // 更新现有词库
        list[index] = vocab;
      } else {
        // 检查数量限制
        if (list.length >= MAX_VOCABS) {
          throw new Error(`自定义词库数量已达上限(${MAX_VOCABS}个)，请先删除部分词库`);
        }
        list.push(vocab);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('保存词库失败:', error);
      alert(`保存失败: ${error.message}`);
      return false;
    }
  };

  /**
   * 删除词库
   * @param {string} id - 词库ID
   * @returns {boolean}
   */
  const remove = (id) => {
    try {
      if (!id || typeof id !== 'string') return false;
      
      const list = getAll();
      const filtered = list.filter(item => item.id !== id);
      
      if (filtered.length === list.length) return false;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('删除词库失败:', error);
      return false;
    }
  };

  /**
   * 批量导入词语
   * @param {string} text - 导入文本
   * @returns {Array}
   */
  const parseImport = (text) => {
    if (!text || typeof text !== 'string') return [];
    
    const lines = text.split('\n');
    const words = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // 支持格式：词语|拼音 或 词语
      const parts = trimmed.split('|').map(p => p.trim());
      
      if (parts[0]) {
        const word = {
          text: SecurityUtils.sanitizeText(parts[0])
        };
        
        if (parts[1]) {
          // 判断是拼音还是释义
          if (/^[a-zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ]+$/i.test(parts[1])) {
            word.pinyin = SecurityUtils.sanitizeText(parts[1]);
          } else {
            word.meaning = SecurityUtils.sanitizeText(parts[1]);
          }
        }
        
        if (word.text && SecurityUtils.validateWord(word)) {
          words.push(word);
        }
      }
    });
    
    // 限制导入数量
    if (words.length > MAX_WORDS_PER_VOCAB) {
      console.warn(`导入词语数量超过限制，只保留前${MAX_WORDS_PER_VOCAB}个`);
      return words.slice(0, MAX_WORDS_PER_VOCAB);
    }
    
    return words;
  };

  /**
   * 清空所有词库
   * @returns {boolean}
   */
  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清空词库失败:', error);
      return false;
    }
  };

  /**
   * 获取统计信息
   * @returns {Object}
   */
  const getStats = () => {
    const list = getAll();
    return {
      totalVocabs: list.length,
      totalWords: list.reduce((sum, vocab) => sum + (vocab.words ? vocab.words.length : 0), 0),
      maxVocabs: MAX_VOCABS,
      maxWordsPerVocab: MAX_WORDS_PER_VOCAB
    };
  };

  // 公共API
  return {
    getAll,
    getById,
    save,
    remove,
    parseImport,
    clear,
    getStats,
    MAX_VOCABS,
    MAX_WORDS_PER_VOCAB
  };
})();

/**
 * 基础词库管理（后台管理用）
 * 存储在 localStorage，可动态编辑
 */
const BuiltinVocab = (() => {
  'use strict';

  const STORAGE_KEY = 'builtin_vocab_data';

  /**
   * 获取基础词库数据
   * @returns {Object}
   */
  const getData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // 如果没有存储数据，返回默认的 VOCAB 数据
      return JSON.parse(JSON.stringify(VOCAB));
    } catch (error) {
      console.error('读取基础词库失败:', error);
      return JSON.parse(JSON.stringify(VOCAB));
    }
  };

  /**
   * 保存基础词库数据
   * @param {Object} data
   * @returns {boolean}
   */
  const saveData = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('保存基础词库失败:', error);
      return false;
    }
  };

  /**
   * 获取指定学期的课文列表
   * @param {string} subject - 'chinese' | 'english'
   * @param {string} grade - 'grade2_semester1' | 'grade2_semester2'
   * @returns {Array}
   */
  const getLessons = (subject, grade) => {
    const data = getData();
    const gradeData = data[subject]?.[grade];
    if (!gradeData) return [];

    return Object.entries(gradeData).map(([key, val]) => ({
      key,
      name: val.name || key,
      wordCount: val.words ? val.words.length : (val.knowledgePoints ? val.knowledgePoints.length : 0),
      vocabType: val.vocabType || 'word',
      knowledgePoints: val.knowledgePoints || null
    }));
  };

  /**
   * 获取单个课文数据
   * @param {string} subject
   * @param {string} grade
   * @param {string} lessonKey
   * @returns {Object|null}
   */
  const getLesson = (subject, grade, lessonKey) => {
    const data = getData();
    return data[subject]?.[grade]?.[lessonKey] || null;
  };

  /**
   * 保存课文
   * @param {string} subject
   * @param {string} grade
   * @param {string} lessonKey - null 表示新建
   * @param {Object} lessonData
   * @returns {string} - 返回 lessonKey
   */
  const saveLesson = (subject, grade, lessonKey, lessonData) => {
    const data = getData();

    // 确保结构存在
    if (!data[subject]) data[subject] = {};
    if (!data[subject][grade]) data[subject][grade] = {};

    // 生成新 key
    if (!lessonKey) {
      const existingKeys = Object.keys(data[subject][grade]);
      const maxNum = existingKeys.reduce((max, k) => {
        const match = k.match(/lesson(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      lessonKey = `lesson${maxNum + 1}`;
    }

    data[subject][grade][lessonKey] = lessonData;
    saveData(data);

    return lessonKey;
  };

  /**
   * 删除课文
   * @param {string} subject
   * @param {string} grade
   * @param {string} lessonKey
   * @returns {boolean}
   */
  const deleteLesson = (subject, grade, lessonKey) => {
    const data = getData();
    if (!data[subject]?.[grade]?.[lessonKey]) return false;

    delete data[subject][grade][lessonKey];
    saveData(data);
    return true;
  };

  /**
   * 解析词语文本
   * @param {string} text - 格式：词语 拼音（每行一个）
   * @returns {Array}
   */
  const parseWords = (text) => {
    if (!text || typeof text !== 'string') return [];

    const lines = text.trim().split('\n');
    const words = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 尝试分离词语和拼音
      // 格式：词语 拼音（拼音可能包含空格）
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const text = parts[0];
        const pinyin = parts.slice(1).join(' ');
        words.push({ text, pinyin });
      } else if (parts.length === 1) {
        words.push({ text: parts[0], pinyin: '' });
      }
    }

    return words;
  };

  /**
   * 重置为基础词库
   * @returns {boolean}
   */
  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('重置基础词库失败:', error);
      return false;
    }
  };

  /**
   * 导出词库数据
   * @returns {string} - JSON字符串
   */
  const exportData = () => {
    return JSON.stringify(getData(), null, 2);
  };

  /**
   * 导入词库数据
   * @param {string} jsonStr
   * @returns {boolean}
   */
  const importData = (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (typeof data !== 'object') return false;
      saveData(data);
      return true;
    } catch (error) {
      console.error('导入词库失败:', error);
      return false;
    }
  };

  // 公共API
  return {
    getData,
    saveData,
    getLessons,
    getLesson,
    saveLesson,
    deleteLesson,
    parseWords,
    reset,
    exportData,
    importData
  };
})();

/**
 * 错题本管理（v7增强版）
 * 新增：复习次数、最后复习时间、掌握状态
 */
const WrongList = (() => {
  'use strict';

  const STORAGE_KEY = 'wronglist';
  const MAX_ITEMS = 500; // 最大错题数量

  /**
   * 获取所有错题
   * @returns {Array}
   */
  const getAll = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const list = JSON.parse(data);
      if (!Array.isArray(list)) return [];
      
      // 迁移旧数据，添加新字段
      return list.map(item => ({
        ...item,
        reviewCount: item.reviewCount || 0,
        lastReviewed: item.lastReviewed || null,
        mastered: item.mastered || false
      })).filter(SecurityUtils.validateWord);
    } catch (error) {
      console.error('读取错题本失败:', error);
      return [];
    }
  };

  /**
   * 获取统计信息
   * @returns {Object}
   */
  const getStats = () => {
    const list = getAll();
    return {
      total: list.length,
      mastered: list.filter(item => item.mastered).length,
      pending: list.filter(item => !item.mastered).length
    };
  };

  /**
   * 获取待复习的错题
   * @param {boolean} shuffle - 是否随机打乱
   * @returns {Array}
   */
  const getPending = (shuffle = false) => {
    let list = getAll().filter(item => !item.mastered);
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    return list;
  };

  /**
   * 添加错题
   * @param {Object} word - 词语对象
   * @param {string} subject - 学科
   * @returns {boolean}
   */
  const add = (word, subject = 'chinese') => {
    try {
      if (!SecurityUtils.validateWord(word)) {
        console.warn('无效的错题数据');
        return false;
      }

      const list = getAll();
      
      // 检查是否已存在
      const exists = list.some(item => item.text === word.text);
      if (exists) return false;

      // 限制数量
      if (list.length >= MAX_ITEMS) {
        list.shift(); // 移除最早的
      }

      list.push({
        text: SecurityUtils.sanitizeText(word.text),
        pinyin: word.pinyin ? SecurityUtils.sanitizeText(word.pinyin) : undefined,
        meaning: word.meaning ? SecurityUtils.sanitizeText(word.meaning) : undefined,
        subject: subject,
        addedAt: new Date().toISOString(),
        reviewCount: 0,
        lastReviewed: null,
        mastered: false
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('添加错题失败:', error);
      return false;
    }
  };

  /**
   * 更新复习状态
   * @param {string} text - 词语文本
   * @param {boolean} mastered - 是否已掌握
   * @returns {boolean}
   */
  const updateReview = (text, mastered = false) => {
    try {
      const list = getAll();
      const index = list.findIndex(item => item.text === text);
      if (index === -1) return false;

      list[index].reviewCount = (list[index].reviewCount || 0) + 1;
      list[index].lastReviewed = new Date().toISOString();
      if (mastered) {
        list[index].mastered = true;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('更新复习状态失败:', error);
      return false;
    }
  };

  /**
   * 批量标记为已掌握
   * @param {Array} texts - 词语文本数组
   * @returns {number} - 成功标记的数量
   */
  const markMastered = (texts) => {
    try {
      const list = getAll();
      let count = 0;
      
      texts.forEach(text => {
        const item = list.find(item => item.text === text);
        if (item) {
          item.mastered = true;
          item.lastReviewed = new Date().toISOString();
          count++;
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return count;
    } catch (error) {
      console.error('批量标记失败:', error);
      return 0;
    }
  };

  /**
   * 删除错题
   * @param {number} index - 索引
   * @returns {boolean}
   */
  const remove = (index) => {
    try {
      const list = getAll();
      if (index < 0 || index >= list.length) return false;
      
      list.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('删除错题失败:', error);
      return false;
    }
  };

  /**
   * 根据文本删除错题
   * @param {string} text - 词语文本
   * @returns {boolean}
   */
  const removeByText = (text) => {
    try {
      const list = getAll();
      const index = list.findIndex(item => item.text === text);
      if (index === -1) return false;
      
      list.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('删除错题失败:', error);
      return false;
    }
  };

  /**
   * 清空错题本
   * @returns {boolean}
   */
  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清空错题本失败:', error);
      return false;
    }
  };

  // 公共API
  return {
    getAll,
    getStats,
    getPending,
    add,
    updateReview,
    markMastered,
    remove,
    removeByText,
    clear,
    MAX_ITEMS
  };
})();

/**
 * 历史记录管理
 */
const History = (() => {
  'use strict';

  const STORAGE_KEY = 'history';
  const MAX_ITEMS = 100; // 最大历史记录数量

  /**
   * 获取所有历史记录
   * @returns {Array}
   */
  const getAll = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const list = JSON.parse(data);
      if (!Array.isArray(list)) return [];
      
      return list.filter(record => {
        return record && record.date && record.subject;
      });
    } catch (error) {
      console.error('读取历史记录失败:', error);
      return [];
    }
  };

  /**
   * 添加历史记录
   * @param {Object} record - 记录对象
   * @returns {boolean}
   */
  const add = (record) => {
    try {
      if (!record || typeof record !== 'object') return false;
      
      const list = getAll();
      
      // 限制数量
      if (list.length >= MAX_ITEMS) {
        list.shift();
      }

      list.push({
        date: record.date || new Date().toLocaleString('zh-CN'),
        subject: SecurityUtils.sanitizeText(record.subject || ''),
        content: record.content ? SecurityUtils.sanitizeText(record.content) : undefined,
        total: parseInt(record.total) || 0,
        wrong: parseInt(record.wrong) || 0,
        accuracy: parseInt(record.accuracy) || 0
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (error) {
      console.error('添加历史记录失败:', error);
      return false;
    }
  };

  /**
   * 清空历史记录
   * @returns {boolean}
   */
  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  };

  // 公共API
  return {
    getAll,
    add,
    clear,
    MAX_ITEMS
  };
})();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VOCAB,
    CustomVocab,
    WrongList,
    History,
    SecurityUtils
  };
}
