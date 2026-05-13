/**
 * math-generator.js - 数学题目自动生成器
 * 支持知识点：加减乘除（1位数/2位数）、竖式、应用题
 * 生成规则：无重复、无负数、整除
 */

var MathGenerator = (function () {

  // 应用题模板
  var WORD_PROBLEM_TEMPLATES = [
    // 加法应用题
    {
      type: 'addition',
      templates: [
        '小明有{a}个苹果，又买了{b}个，现在一共有多少个苹果？',
        '图书角有{a}本故事书，又买来{b}本，现在一共有多少本故事书？',
        '停车场有{a}辆车，又开来了{b}辆，现在一共有多少辆车？',
        '花园里有{a}朵红花和{b}朵黄花，一共有多少朵花？'
      ],
      calc: function(a, b) { return a + b; }
    },
    // 减法应用题
    {
      type: 'subtraction',
      templates: [
        '篮子里有{a}个橘子，吃掉了{b}个，还剩多少个橘子？',
        '书架上有{a}本书，借走了{b}本，还剩多少本书？',
        '妈妈买了{a}个鸡蛋，做菜用了{b}个，还剩多少个鸡蛋？',
        '池塘里有{a}条鱼，游走了{b}条，还剩多少条鱼？'
      ],
      calc: function(a, b) { return a - b; }
    },
    // 乘法应用题
    {
      type: 'multiplication',
      templates: [
        '每盒有{a}颗糖果，{b}盒一共有多少颗糖果？',
        '每行种{a}棵树，种了{b}行，一共种了多少棵树？',
        '一本故事书{a}页，{b}本一共多少页？',
        '每只小猫有{a}条腿，{b}只小猫一共有多少条腿？'
      ],
      calc: function(a, b) { return a * b; }
    }
  ];

  /**
   * 根据知识点配置生成题目
   * @param {Array} knowledgePoints - [{ type, label, count }]
   * @returns {Array} [{ text, type, answer }]
   */
  function generate(knowledgePoints) {
    if (!knowledgePoints || !knowledgePoints.length) return [];

    var allQuestions = [];
    var usedSet = {}; // 防重复

    knowledgePoints.forEach(function (kp) {
      var count = kp.count || 5;
      var generated = generateByType(kp.type, count, usedSet);
      allQuestions = allQuestions.concat(generated);
    });

    return allQuestions;
  }

  /**
   * 按知识点类型生成题目
   */
  function generateByType(type, count, usedSet) {
    var results = [];
    var maxAttempts = count * 10;
    var attempts = 0;

    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      var q = createQuestion(type);
      if (q && !usedSet[q.text]) {
        usedSet[q.text] = true;
        results.push(q);
      }
    }

    return results;
  }

  /**
   * 创建单个题目
   */
  function createQuestion(type) {
    var a, b, result, text;

    switch (type) {
      case 'addition_1digit':
        a = randInt(1, 9);
        b = randInt(1, 9);
        return { text: a + '+' + b + '=', type: 'oral', answer: String(a + b) };

      case 'addition_2digit_no_carry':
        a = randInt(10, 99);
        b = randInt(1, 9);
        if ((a % 10) + b >= 10) {
          a = a - (a % 10) + randInt(0, 9 - b);
          if (a < 10) a = 10;
        }
        return { text: a + '+' + b + '=', type: 'oral', answer: String(a + b) };

      case 'addition_2digit_carry':
        a = randInt(10, 99);
        b = randInt(1, 9);
        if ((a % 10) + b < 10) {
          a = a - (a % 10) + (10 - b) + randInt(0, Math.min(9, 99 - a + (a % 10)));
          if (a < 10) a = 10 + (10 - b);
          if (a > 99) a = 99;
        }
        return { text: a + '+' + b + '=', type: 'oral', answer: String(a + b) };

      case 'addition_2digit':
        a = randInt(10, 99);
        b = randInt(10, 99);
        if (a + b > 200) {
          b = randInt(10, 99 - (a - 10));
        }
        return { text: a + '+' + b + '=', type: 'oral', answer: String(a + b) };

      case 'subtraction_1digit':
        a = randInt(2, 9);
        b = randInt(1, a - 1);
        return { text: a + '-' + b + '=', type: 'oral', answer: String(a - b) };

      case 'subtraction_2digit_no_borrow':
        a = randInt(20, 99);
        b = randInt(10, a - 1);
        if ((a % 10) < (b % 10)) {
          var aOnes = a % 10;
          var bOnes = b % 10;
          a = a - aOnes + bOnes + randInt(0, 9 - bOnes);
          if (a > 99) a = 99;
          if (a <= b) a = b + 10;
        }
        return { text: a + '-' + b + '=', type: 'oral', answer: String(a - b) };

      case 'subtraction_2digit_borrow':
        a = randInt(20, 99);
        b = randInt(10, a - 1);
        if ((a % 10) >= (b % 10)) {
          var aOnes = a % 10;
          var bOnes = b % 10;
          if (bOnes === 0) bOnes = 1;
          a = a - aOnes + randInt(0, bOnes - 1);
          if (a < 10) a = 10 + randInt(0, bOnes - 1);
          if (a <= b) a = b + randInt(1, 10);
          if (a > 99) a = 99;
        }
        return { text: a + '-' + b + '=', type: 'oral', answer: String(a - b) };

      case 'subtraction_2digit':
        a = randInt(20, 99);
        b = randInt(10, a - 1);
        return { text: a + '-' + b + '=', type: 'oral', answer: String(a - b) };

      case 'multiplication_99':
        a = randInt(1, 9);
        b = randInt(1, 9);
        return { text: a + '×' + b + '=', type: 'oral', answer: String(a * b) };

      case 'division_simple':
        a = randInt(1, 9);
        b = randInt(1, 9);
        result = a * b;
        return { text: result + '÷' + a + '=', type: 'oral', answer: String(b) };

      // 竖式加法
      case 'vertical_addition':
        a = randInt(10, 99);
        b = randInt(10, 99);
        // 确保进位
        if ((a % 10) + (b % 10) < 10) {
          a = a + (10 - (a % 10) - (b % 10));
          if (a > 99) a = randInt(10, 99);
        }
        if (a + b > 200) {
          b = 100 - a + randInt(10, 50);
        }
        return { 
          text: formatVerticalAddition(a, b), 
          type: 'vertical', 
          answer: String(a + b),
          plainText: a + '+' + b + '='
        };

      // 竖式减法
      case 'vertical_subtraction':
        a = randInt(20, 99);
        b = randInt(10, a - 1);
        // 确保退位
        if ((a % 10) >= (b % 10)) {
          var temp = a;
          a = a - (a % 10) + randInt(0, Math.min((b % 10) - 1, 9));
          if (a <= b) a = temp + 10;
          if (a > 99) a = 99;
        }
        return { 
          text: formatVerticalSubtraction(a, b), 
          type: 'vertical', 
          answer: String(a - b),
          plainText: a + '-' + b + '='
        };

      // 应用题
      case 'word_problem_addition':
        return createWordProblem('addition');
      case 'word_problem_subtraction':
        return createWordProblem('subtraction');
      case 'word_problem_multiplication':
        return createWordProblem('multiplication');
      case 'word_problem':
        // 随机选择应用题类型
        var types = ['addition', 'subtraction', 'multiplication'];
        return createWordProblem(types[randInt(0, 2)]);

      default:
        return null;
    }
  }

  /**
   * 格式化竖式加法
   */
  function formatVerticalAddition(a, b) {
    var aStr = String(a).padStart(2, ' ');
    var bStr = String(b).padStart(2, ' ');
    return '  ' + aStr + '\n+ ' + bStr + '\n────';
  }

  /**
   * 格式化竖式减法
   */
  function formatVerticalSubtraction(a, b) {
    var aStr = String(a).padStart(2, ' ');
    var bStr = String(b).padStart(2, ' ');
    return '  ' + aStr + '\n- ' + bStr + '\n────';
  }

  /**
   * 创建应用题
   */
  function createWordProblem(problemType) {
    var templateGroup = WORD_PROBLEM_TEMPLATES.find(function(t) { 
      return t.type === problemType; 
    });
    if (!templateGroup) return null;

    var a, b;
    // 根据类型生成合适的数字
    if (problemType === 'addition') {
      a = randInt(10, 50);
      b = randInt(10, 50);
    } else if (problemType === 'subtraction') {
      a = randInt(20, 99);
      b = randInt(10, a - 1);
    } else if (problemType === 'multiplication') {
      a = randInt(2, 9);
      b = randInt(2, 9);
    }

    var templates = templateGroup.templates;
    var template = templates[randInt(0, templates.length - 1)];
    var text = template.replace('{a}', a).replace('{b}', b);
    var answer = templateGroup.calc(a, b);

    return { text: text, type: 'word', answer: String(answer) };
  }

  /**
   * 生成 [min, max] 范围内的随机整数
   */
  function randInt(min, max) {
    if (min > max) { var t = min; min = max; max = t; }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 数学表达式转中文朗读文本
   * @param {string} text - 如 "23+45="
   * @returns {string} - 如 "二十三加四十五等于"
   */
  function toChineseSpeech(text) {
    if (!text) return text;
    // 移除末尾等号
    var expr = text.replace(/=$/, '');

    // 替换运算符
    expr = expr.replace(/×/g, '乘以');
    expr = expr.replace(/÷/g, '除以');
    expr = expr.replace(/\+/g, '加');
    expr = expr.replace(/-/g, '减');

    // 数字转中文
    expr = expr.replace(/\d+/g, function (numStr) {
      return numberToChinese(parseInt(numStr));
    });

    return expr + '等于';
  }

  /**
   * 数字转中文（0-999）
   */
  function numberToChinese(num) {
    if (num === 0) return '零';
    var digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    var result = '';

    if (num >= 100) {
      result += digits[Math.floor(num / 100)] + '百';
      num = num % 100;
      if (num > 0 && num < 10) result += '零';
    }
    if (num >= 10) {
      var tens = Math.floor(num / 10);
      if (tens > 1 || result.length > 0) {
        result += digits[tens];
      }
      result += '十';
      num = num % 10;
    }
    if (num > 0) {
      result += digits[num];
    }

    return result;
  }

  return {
    generate: generate,
    toChineseSpeech: toChineseSpeech
  };
})();
