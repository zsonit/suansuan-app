// 出题引擎 v3：数学 + 语文 + 英语（参考小猿口算题型体系 + 乐喵口算专项分类）
// 题型交互分四类：input 数字键盘 / compare 选 > < = / judge 判断对错 / choice 四选一

import * as lang from './langdata.js'

export const LEVELS = [
  { key: 1, name: '10以内', max: 10, mulMax: 5 },
  { key: 2, name: '20以内', max: 20, mulMax: 9 },
  { key: 3, name: '100以内', max: 100, mulMax: 9 },
  { key: 4, name: '1000以内', max: 1000, mulMax: 20 }
]

export const COUNTS = [10, 20, 30]

// 分组模式表（levels: 该模式可用的难度）
export const GROUPS = [
  {
    key: 'basic',
    name: '基础计算',
    img: '/static/icons/basic.png',
    emoji: '📝',
    modes: [
      { key: 'add', name: '加法', emoji: '➕', desc: '两数相加', levels: [1, 2, 3, 4] },
      { key: 'sub', name: '减法', emoji: '➖', desc: '两数相减', levels: [1, 2, 3, 4] },
      { key: 'addsub', name: '加减混合', emoji: '±', desc: '加减随机', levels: [1, 2, 3, 4] },
      { key: 'mul', name: '乘法', emoji: '✖️', desc: '乘法口诀', levels: [1, 2, 3, 4] },
      { key: 'div', name: '除法', emoji: '➗', desc: '整除练习', levels: [2, 3, 4] },
      { key: 'mix', name: '四则混合', emoji: '🎲', desc: '加减乘除随机', levels: [2, 3, 4] }
    ]
  },
  {
    key: 'skill',
    name: '专项技巧',
    img: '/static/icons/skill.png',
    emoji: '🎯',
    modes: [
      { key: 'tens', name: '凑十法', emoji: '🔟', desc: '9加几、8加几…进位加', levels: [2] },
      { key: 'break', name: '破十法', emoji: '💥', desc: '十几减9、减8…退位减', levels: [2] },
      { key: 'carry', name: '进位加法', emoji: '⬆️', desc: '个位满十向十位进一', levels: [3, 4] },
      { key: 'borrow', name: '退位减法', emoji: '⬇️', desc: '个位不够向十位借一', levels: [3, 4] },
      { key: 'chain', name: '连加连减', emoji: '⛓️', desc: '三个数连续运算', levels: [1, 2, 3, 4] },
      { key: 'bracket', name: '括号混合', emoji: '🧩', desc: '先乘除后加减、带括号', levels: [2, 3, 4] },
      { key: 'divr', name: '有余数除法', emoji: '🥧', desc: '求商或求余数', levels: [3, 4] }
    ]
  },
  {
    key: 'cmp',
    name: '比一比',
    img: '/static/icons/cmp.png',
    emoji: '🔍',
    modes: [
      { key: 'cmpnum', name: '数字比大小', emoji: '🆚', desc: '填 > < 或 =', levels: [1, 2, 3, 4] },
      { key: 'cmpexpr', name: '算式比大小', emoji: '🧮', desc: '比较两个算式的结果', levels: [1, 2, 3] }
    ]
  },
  {
    key: 'blank',
    name: '填空挑战',
    img: '/static/icons/blank.png',
    emoji: '✏️',
    modes: [
      { key: 'missadd', name: '缺加数', emoji: '❓', desc: '3 + ? = 7', levels: [1, 2, 3, 4] },
      { key: 'misssub', name: '缺减数', emoji: '🕳️', desc: '? - 2 = 5 / 9 - ? = 4', levels: [1, 2, 3, 4] },
      { key: 'missmul', name: '缺乘数', emoji: '📦', desc: '3 × ? = 12', levels: [2, 3] }
    ]
  },
  {
    key: 'judge',
    name: '对错判断',
    img: '/static/icons/judge.png',
    emoji: '⚖️',
    modes: [
      { key: 'judge', name: '对错小法官', emoji: '👀', desc: '判断算式对不对', levels: [1, 2, 3, 4] }
    ]
  },
  {
    key: 'adv',
    name: '小数分数',
    img: '/static/icons/adv.png',
    emoji: '🧾',
    modes: [
      { key: 'dec', name: '小数加减', emoji: '🔸', desc: '一位/两位小数', levels: [1, 2, 3] },
      { key: 'frac', name: '分数加减', emoji: '🍕', desc: '同分母 / 倍数异分母', levels: [1, 2, 3] }
    ]
  },
  {
    key: 'cn',
    name: '语文',
    img: '/static/icons/cn.png',
    emoji: '📖',
    modes: [
      { key: 'cn_opp', name: '反义词', emoji: '↔️', desc: '找意思相反的词', levels: [1], grades: [1, 2], lang: true },
      { key: 'cn_pinyin', name: '选读音', emoji: '🔊', desc: '汉字的正确读音', levels: [1], grades: [1, 2], lang: true },
      { key: 'cn_meas', name: '量词', emoji: '🧺', desc: '一只？一条？一朵？', levels: [1], grades: [1, 2, 3], lang: true },
      { key: 'cn_poem', name: '古诗填空', emoji: '📜', desc: '补全经典诗句', levels: [1], grades: [1, 2, 3], lang: true },
      { key: 'cn_syn', name: '近义词', emoji: '🤝', desc: '找意思相近的词', levels: [1], grades: [3, 4, 5, 6], lang: true },
      { key: 'cn_idiom', name: '成语填空', emoji: '🐉', desc: '补全成语', levels: [1], grades: [4, 5, 6], lang: true }
    ]
  },
  {
    key: 'en',
    name: '英语',
    img: '/static/icons/en.png',
    emoji: '🔤',
    modes: [
      { key: 'en_letter', name: '字母练习', emoji: '🅰️', desc: '大小写与字母顺序', levels: [1], grades: [3], lang: true },
      { key: 'en_word_pic', name: '看图识词', emoji: '🍎', desc: '图案对应的英文单词', levels: [1], grades: [3, 4, 5, 6], lang: true },
      { key: 'en_word_mean', name: '单词翻译', emoji: '💬', desc: '单词的中文意思', levels: [1], grades: [3, 4, 5, 6], lang: true },
      { key: 'en_missing', name: '缺字母', emoji: '🔡', desc: '补全单词的字母', levels: [1], grades: [4, 5, 6], lang: true },
      { key: 'en_grammar', name: '选词填空', emoji: '✒️', desc: 'am/is/are、a/an、疑问词', levels: [1], grades: [5, 6], lang: true }
    ]
  },
  {
    key: 'game',
    name: '趣味游戏',
    img: '/static/icons/game.png',
    emoji: '🎮',
    modes: [
      { key: 'balloon', name: '气球抢答', emoji: '🎈', desc: '点爆正确答案气球', levels: [1, 2, 3, 4] },
      { key: 'match', name: '数字对对碰', emoji: '🃏', desc: '算式答案连连配', levels: [1, 2, 3, 4] },
      { key: 'racer', name: '限时挑战', emoji: '⏱️', desc: '60秒极限速算连击', levels: [1, 2, 3, 4] },
      { key: 'balance', name: '天平砝码', emoji: '⚖️', desc: '选砝码让天平平衡', levels: [1, 2, 3, 4] },
      { key: 'memory', name: '翻牌记忆', emoji: '🧠', desc: '翻牌配对算式答案', levels: [1, 2, 3, 4] }
    ]
  },
  {
    key: 'unit',
    name: '单位换算',
    emoji: '📏',
    modes: [
      { key: 'unit', name: '单位换算', emoji: '📐', desc: '米厘米 / 时分 / 元角', levels: [1, 2, 3, 4] }
    ]
  }
]

export const MODES = GROUPS.flatMap((g) => g.modes)

// 分年级课程表：每项 [模式, 推荐难度]，按人教版教材进度排列
export const GRADES = [
  {
    key: 1,
    name: '一年级',
    emoji: '🌱',
    items: [
      ['add', 1], ['sub', 1], ['addsub', 2], ['tens', 2], ['break', 2],
      ['chain', 2], ['cmpnum', 1], ['cmpexpr', 1], ['missadd', 2], ['misssub', 2],
      ['judge', 1], ['unit', 1]
    ]
  },
  {
    key: 2,
    name: '二年级',
    emoji: '🌿',
    items: [
      ['add', 3], ['sub', 3], ['carry', 3], ['borrow', 3], ['mul', 2], ['div', 2],
      ['divr', 3], ['chain', 3], ['cmpnum', 3], ['cmpexpr', 2], ['missmul', 2],
      ['judge', 3], ['unit', 2]
    ]
  },
  {
    key: 3,
    name: '三年级',
    emoji: '🌳',
    items: [
      ['add', 4], ['sub', 4], ['carry', 4], ['borrow', 4], ['mul', 3], ['div', 3],
      ['divr', 4], ['bracket', 3], ['chain', 4], ['cmpnum', 4], ['missadd', 4],
      ['judge', 4], ['unit', 3]
    ]
  },
  {
    key: 4,
    name: '四年级',
    emoji: '🔶',
    items: [
      ['mul', 4], ['div', 4], ['bracket', 4], ['add', 4], ['sub', 4], ['chain', 4],
      ['cmpnum', 4], ['cmpexpr', 3], ['unit', 4], ['dec', 1], ['judge', 4]
    ]
  },
  {
    key: 5,
    name: '五年级',
    emoji: '🔷',
    items: [
      ['dec', 2], ['frac', 1], ['frac', 2], ['mul', 4], ['div', 4], ['bracket', 4],
      ['divr', 4], ['add', 4], ['sub', 4]
    ]
  },
  {
    key: 6,
    name: '六年级',
    emoji: '⭐',
    items: [
      ['frac', 2], ['frac', 3], ['dec', 3], ['divr', 4], ['bracket', 4], ['judge', 4],
      ['cmpexpr', 3]
    ]
  }
]

// 按模式还原交互类型
export function typeOfMode(mode) {
  const m = String(mode || '')
  if (m.startsWith('cn_') || m.startsWith('en_')) return 'choice'
  if (m.startsWith('cmp')) return 'compare'
  if (m === 'judge') return 'judge'
  if (m === 'frac') return 'frac'
  return 'input'
}

function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[ri(0, arr.length - 1)]
}
function levelOf(key) {
  return LEVELS.find((l) => l.key === Number(key)) || LEVELS[0]
}

// ---------- 基础计算 ----------
function makeAdd(lv) {
  const a = ri(1, lv.max - 1)
  const b = ri(1, lv.max - a)
  return { text: `${a} + ${b}`, answer: a + b }
}
function makeSub(lv) {
  const a = ri(2, lv.max)
  const b = ri(1, a)
  return { text: `${a} - ${b}`, answer: a - b }
}
function makeMul(lv) {
  // lv4: 两位数 × 一位数
  if (lv.key === 4) {
    const a = ri(12, 99)
    const b = ri(2, 9)
    return { text: `${a} × ${b}`, answer: a * b }
  }
  const a = ri(1, lv.mulMax)
  const b = ri(1, lv.mulMax)
  return { text: `${a} × ${b}`, answer: a * b }
}
function makeDiv(lv) {
  if (lv.key === 4) {
    const b = ri(2, 9)
    const q = ri(11, 99)
    return { text: `${b * q} ÷ ${b}`, answer: q }
  }
  const b = ri(2, lv.mulMax)
  const q = ri(1, lv.mulMax)
  return { text: `${b * q} ÷ ${b}`, answer: q }
}

// ---------- 专项技巧 ----------
function makeTens() {
  // 凑十：6~9 加几，和为 11~18
  const a = ri(6, 9)
  const b = ri(11 - a, 9)
  return { text: `${a} + ${b}`, answer: a + b }
}
function makeBreak() {
  // 破十：十几减几，退位（差为 2~9）
  const a = ri(11, 18)
  const b = ri(Math.max(a - 9, 2), a - 2)
  return { text: `${a} - ${b}`, answer: a - b }
}
function makeCarry(lv) {
  if (lv.key === 4) {
    // 三位数进位加
    let a, b
    do {
      a = ri(105, 899)
      b = ri(15, 99)
    } while (a % 10 + b % 10 < 10 || a + b > 999)
    return { text: `${a} + ${b}`, answer: a + b }
  }
  // 两位数 + 一位数，个位满十
  const a = ri(12, 89)
  const b = ri(10 - (a % 10), 9)
  return { text: `${a} + ${b}`, answer: a + b }
}
function makeBorrow(lv) {
  if (lv.key === 4) {
    // 三位数退位减
    let a, b
    do {
      a = ri(115, 999)
      b = ri(11, 99)
    } while (a % 10 >= b % 10 || a - b < 10)
    return { text: `${a} - ${b}`, answer: a - b }
  }
  // 两位数 - 一位数，个位不够减
  const a = ri(20, 99)
  const b = ri((a % 10) + 1, 9)
  return { text: `${a} - ${b}`, answer: a - b }
}
function makeChain(lv) {
  const m = lv.max
  const type = pick(['add3', 'sub3', 'mixed'])
  if (type === 'add3') {
    const a = ri(1, Math.max(1, Math.floor(m / 3)))
    const b = ri(1, Math.max(1, Math.floor(m / 3)))
    const c = ri(1, Math.max(1, m - a - b))
    return { text: `${a} + ${b} + ${c}`, answer: a + b + c }
  }
  if (type === 'sub3') {
    const a = ri(Math.max(4, Math.floor(m / 2)), m)
    const b = ri(1, a - 2)
    const c = ri(1, a - b - 1)
    return { text: `${a} - ${b} - ${c}`, answer: a - b - c }
  }
  const a = ri(Math.max(3, Math.floor(m / 2)), m)
  const b = ri(1, a - 1)
  const c = ri(1, a - b)
  return { text: `${a} + ${b} - ${c}`, answer: a + b - c }
}
function makeBracket(lv) {
  const m = lv.key === 2 ? 9 : lv.key === 3 ? 20 : 50
  const type = pick(['mulAdd', 'addMul', 'parenMul', 'divAdd'])
  if (type === 'mulAdd') {
    const a = ri(2, Math.min(9, m))
    const b = ri(2, Math.min(9, m))
    const c = ri(1, Math.max(1, m))
    return { text: `${a} × ${b} + ${c}`, answer: a * b + c }
  }
  if (type === 'addMul') {
    const a = ri(1, Math.max(1, m))
    const b = ri(2, Math.min(9, m))
    const c = ri(2, Math.min(9, Math.floor((m * 2) / b)))
    return { text: `${a} + ${b} × ${c}`, answer: a + b * c }
  }
  if (type === 'parenMul') {
    const a = ri(1, Math.max(1, m))
    const b = ri(1, Math.max(1, m))
    const c = ri(2, Math.min(9, Math.floor(100 / (a + b)) || 2))
    return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c }
  }
  // 除法 participating: a ÷ b + c
  const b = ri(2, 9)
  const q = ri(1, 9)
  const c = ri(1, Math.max(1, m))
  return { text: `${b * q} ÷ ${b} + ${c}`, answer: q + c }
}
function makeDivRem(lv) {
  const bMax = lv.key === 4 ? 9 : 6
  const qMax = lv.key === 4 ? 20 : 9
  const b = ri(3, bMax)
  const q = ri(1, qMax)
  const r = ri(1, b - 1)
  const a = b * q + r
  // 随机求商或求余数
  if (Math.random() < 0.5) {
    return { text: `${a} ÷ ${b} = ? 余 ${r}`, answer: q }
  }
  return { text: `${a} ÷ ${b} = ${q} 余 ?`, answer: r }
}

// ---------- 比一比 ----------
function symOf(diff) {
  return diff > 0 ? '>' : diff < 0 ? '<' : '='
}
function makeCmpNum(lv) {
  let a = ri(0, lv.max)
  let b = ri(0, lv.max)
  if (Math.random() < 0.15) b = a // 少量相等
  return { text: `${a} ○ ${b}`, answer: symOf(a - b), type: 'compare' }
}
function makeCmpExpr(lv) {
  function side() {
    if (Math.random() < 0.5) {
      const x = ri(1, Math.floor(lv.max / 2))
      const y = ri(1, Math.floor(lv.max / 2))
      return { text: `${x} + ${y}`, val: x + y }
    }
    const x = ri(2, lv.max)
    const y = ri(1, x - 1)
    return { text: `${x} - ${y}`, val: x - y }
  }
  let L = side()
  let R = side()
  if (Math.random() < 0.15) R = { ...L } // 少量相等
  return { text: `${L.text} ○ ${R.text}`, answer: symOf(L.val - R.val), type: 'compare' }
}

// ---------- 填空 ----------
function makeMissAdd(lv) {
  const s = ri(2, lv.max)
  const a = ri(1, s - 1)
  if (Math.random() < 0.5) return { text: `${a} + ? = ${s}`, answer: s - a }
  return { text: `? + ${a} = ${s}`, answer: s - a }
}
function makeMissSub(lv) {
  if (Math.random() < 0.5) {
    // ? - b = c
    const b = ri(1, Math.max(1, Math.floor(lv.max / 2)))
    const c = ri(1, Math.max(1, Math.floor(lv.max / 2)))
    return { text: `? - ${b} = ${c}`, answer: b + c }
  }
  // a - ? = c
  const a = ri(3, lv.max)
  const c = ri(1, a - 1)
  return { text: `${a} - ? = ${c}`, answer: a - c }
}
function makeMissMul(lv) {
  const m = lv.key === 3 ? 20 : 9
  const a = ri(2, Math.min(9, m))
  const b = ri(2, 9)
  if (Math.random() < 0.5) return { text: `${a} × ? = ${a * b}`, answer: b }
  return { text: `? × ${b} = ${a * b}`, answer: a }
}

// ---------- 对错判断 ----------
function makeJudge(lv) {
  const base =
    Math.random() < 0.5
      ? (() => {
          const a = ri(1, lv.max - 1)
          const b = ri(1, lv.max - a)
          return { text: `${a} + ${b}`, val: a + b }
        })()
      : (() => {
          const a = ri(2, lv.max)
          const b = ri(1, a)
          return { text: `${a} - ${b}`, val: a - b }
        })()
  const isRight = Math.random() < 0.5
  let shown = base.val
  if (!isRight) {
    const off = pick([-3, -2, -1, 1, 2, 3])
    shown = Math.max(0, base.val + off)
    if (shown === base.val) shown = base.val + 2
  }
  return {
    text: `${base.text} = ${shown}`,
    answer: isRight ? '√' : '×',
    type: 'judge'
  }
}

// ---------- 单位换算 ----------
const UNIT_TABLES = [
  { a: '米', b: '厘米', rate: 100, cap: [1, 99] },
  { a: '时', b: '分', rate: 60, cap: [1, 12] },
  { a: '元', b: '角', rate: 10, cap: [1, 99] },
  { a: '分', b: '秒', rate: 60, cap: [1, 30] }
]
function makeUnit(lv) {
  const t = pick(UNIT_TABLES)
  const scale = lv.key === 1 ? [1, 5] : lv.key === 2 ? [1, 9] : [1, 99]
  const n = ri(Math.max(scale[0], t.cap[0]), Math.min(scale[1], t.cap[1]))
  if (Math.random() < 0.5) {
    return { text: `${n} ${t.a} = ? ${t.b}`, answer: n * t.rate }
  }
  return { text: `${n * t.rate} ${t.b} = ? ${t.a}`, answer: n }
}

// ---------- 小数 / 分数 ----------
function fmtDec(t, d) {
  const v = t / d
  return Number.isInteger(v) ? String(v) : String(v)
}
function makeDec(lv) {
  const doSub = Math.random() < 0.5
  if (lv.key === 1) {
    // 一位小数，0.5 ~ 49.9
    const at = ri(5, 499)
    let bt = ri(1, doSub ? at - 1 : 499 - at)
    if (doSub) return { text: `${fmtDec(at, 10)} - ${fmtDec(bt, 10)}`, answer: (at - bt) / 10 }
    return { text: `${fmtDec(at, 10)} + ${fmtDec(bt, 10)}`, answer: (at + bt) / 10 }
  }
  if (lv.key === 2) {
    // 两位小数，0.05 ~ 9.99
    const ah = ri(5, 999)
    const bh = ri(1, doSub ? ah - 1 : 999 - ah)
    if (doSub) return { text: `${fmtDec(ah, 100)} - ${fmtDec(bh, 100)}`, answer: (ah - bh) / 100 }
    return { text: `${fmtDec(ah, 100)} + ${fmtDec(bh, 100)}`, answer: (ah + bh) / 100 }
  }
  // lv3：一大一小混合
  const at = ri(150, 9999)
  const bt = ri(1, doSub ? at - 1 : 9999 - at)
  if (doSub) return { text: `${fmtDec(at, 100)} - ${fmtDec(bt, 100)}`, answer: (at - bt) / 100 }
  return { text: `${fmtDec(at, 100)} + ${fmtDec(bt, 100)}`, answer: (at + bt) / 100 }
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}
function fracStr(n, d) {
  const g = gcd(n, d)
  const rn = n / g
  const rd = d / g
  return rd === 1 ? String(rn) : `${rn}/${rd}`
}
function makeFrac(lv) {
  if (lv.key === 3) {
    // 倍数关系异分母：d2 = 2×d1 或 3×d1
    const d1 = ri(2, 6)
    const d2 = d1 * pick([2, 3])
    const a = ri(1, d1 - 1)
    const b = ri(1, d2 - 1)
    const doSub = Math.random() < 0.4
    if (doSub && a / d1 > b / d2) {
      // a/d1 - b/d2
      const n = a * (d2 / d1) - b
      if (n <= 0) return { text: `${b}/${d2} + ${a}/${d1}`, answer: fracStr(b * 1 + a * (d2 / d1), d2), type: 'frac' }
      return { text: `${a}/${d1} - ${b}/${d2}`, answer: fracStr(n, d2), type: 'frac' }
    }
    return { text: `${a}/${d1} + ${b}/${d2}`, answer: fracStr(a * (d2 / d1) + b, d2), type: 'frac' }
  }
  // 同分母
  const d = ri(2, lv.key === 1 ? 6 : 12)
  let a = ri(1, d - 1)
  let b = ri(1, d - 1)
  const doSub = lv.key >= 2 && Math.random() < 0.4
  if (doSub) {
    if (b > a) {
      const tmp = a
      a = b
      b = tmp
    } // 保证非负
    return { text: `${a}/${d} - ${b}/${d}`, answer: fracStr(a - b, d), type: 'frac' }
  }
  // 加法不超过 1 更符合教学场景
  b = ri(1, d - a)
  return { text: `${a}/${d} + ${b}/${d}`, answer: fracStr(a + b, d), type: 'frac' }
}

// ---------- 总调度 ----------
function buildOne(mode, lv) {
  switch (mode) {
    case 'add':
      return makeAdd(lv)
    case 'sub':
      return makeSub(lv)
    case 'addsub':
      return Math.random() < 0.5 ? makeAdd(lv) : makeSub(lv)
    case 'mul':
      return makeMul(lv)
    case 'div':
      return makeDiv(lv)
    case 'mix': {
      const pool = ['add', 'sub', 'mul', 'div']
      return buildOne(pick(pool), lv)
    }
    case 'tens':
      return makeTens()
    case 'break':
      return makeBreak()
    case 'carry':
      return makeCarry(lv)
    case 'borrow':
      return makeBorrow(lv)
    case 'chain':
      return makeChain(lv)
    case 'bracket':
      return makeBracket(lv)
    case 'divr':
      return makeDivRem(lv)
    case 'cmpnum':
      return makeCmpNum(lv)
    case 'cmpexpr':
      return makeCmpExpr(lv)
    case 'missadd':
      return makeMissAdd(lv)
    case 'misssub':
      return makeMissSub(lv)
    case 'missmul':
      return makeMissMul(lv)
    case 'judge':
      return makeJudge(lv)
    case 'unit':
      return makeUnit(lv)
    case 'dec':
      return makeDec(lv)
    case 'frac':
      return makeFrac(lv)
    case 'cn_opp':
      return lang.cnOpp()
    case 'cn_syn':
      return lang.cnSyn()
    case 'cn_meas':
      return lang.cnMeas()
    case 'cn_pinyin':
      return lang.cnPinyin()
    case 'cn_poem':
      return lang.cnPoem()
    case 'cn_idiom':
      return lang.cnIdiom()
    case 'en_letter':
      return lang.enLetter()
    case 'en_word_pic':
      return lang.enWordPic()
    case 'en_word_mean':
      return lang.enWordMean()
    case 'en_missing':
      return lang.enMissing()
    case 'en_grammar':
      return lang.enGrammar()
    default:
      return makeAdd(lv)
  }
}

// 按年级综合出题：从年级课表条目里混合抽样，难度严格跟随年级推荐值
export function generateForGrade(grade, count) {
  const g = GRADES.find((x) => x.key === Number(grade)) || GRADES[0]
  const list = []
  const seen = new Set()
  let guard = 0
  while (list.length < count && guard < count * 60) {
    guard++
    const [mk, lv] = g.items[ri(0, g.items.length - 1)]
    const q = buildOne(mk, levelOf(lv))
    if (seen.has(q.text)) continue
    seen.add(q.text)
    list.push({
      id: list.length + 1,
      text: q.text,
      answer: q.answer,
      type: q.type || typeOfMode(mk),
      mode: mk,
      options: q.options
    })
  }
  return list
}

export function generate(mode, difficulty, count) {
  const lv = levelOf(difficulty)
  const list = []
  const seen = new Set()
  let guard = 0
  while (list.length < count && guard < count * 60) {
    guard++
    const q = buildOne(mode, lv)
    if (seen.has(q.text)) continue
    seen.add(q.text)
    list.push({
      id: list.length + 1,
      text: q.text,
      answer: q.answer,
      type: q.type || 'input',
      mode,
      options: q.options
    })
  }
  return list
}

// 用错题本生成练习队列（按 mode key 还原交互类型）
export function fromWrong(items) {
  return items.map((w, i) => {
    const mode = w.mode || 'mix'
    return {
      id: i + 1,
      text: w.text,
      answer: w.answer,
      type: typeOfMode(mode),
      mode,
      options: w.options
    }
  })
}

export function modeName(key) {
  if (key === 'grade') return '年级综合'
  if (String(key).startsWith('grade')) {
    const g = GRADES.find((x) => x.key === Number(String(key).slice(5)))
    return g ? `${g.name}综合` : '年级综合'
  }
  const m = MODES.find((x) => x.key === key)
  return m ? m.name : '练习'
}

// 错题展示：符号答案（>、<、=、√、×）和填空类题目用「答案：」，其余拼 =
export function exprText(w) {
  const a = String(w.answer)
  if (typeof w.answer === 'number') return `${w.text} = ${w.answer}`
  if (/^[√×<>]$/.test(a)) return `${w.text}　答案：${a}`
  if (a.includes('/') && String(w.text).includes('/')) return `${w.text} = ${w.answer}`
  if (/[＿_（]/.test(String(w.text)) || /[?？]/.test(String(w.text)) || /^[a-zA-Z]$/.test(a)) {
    return `${w.text}　答案：${a}`
  }
  return `${w.text} = ${w.answer}`
}
export function modeOf(key) {
  return MODES.find((x) => x.key === key)
}
export function groupOf(key) {
  return GROUPS.find((g) => g.modes.some((m) => m.key === key))
}

// ---------- 趣味游戏辅助 ----------
// 为气球抢答/对对碰生成纯输入类题目：跟随年级（优先）或基础混合
export function generateForGame({ grade, difficulty, count }) {
  const want = Math.max(4, count)
  let pool = grade
    ? generateForGrade(grade, want * 3)
    : generate('mix', difficulty, want * 3)
  let list = pool.filter((q) => q.type === 'input' && typeof q.answer === 'number')
  if (list.length > want) list = list.slice(0, want)
  let guard = 0
  while (list.length < want && guard < 40) {
    guard++
    const extra = generate('addsub', difficulty, want).filter(
      (q) => typeof q.answer === 'number'
    )
    for (const q of extra) {
      if (list.length >= want) break
      if (!list.some((x) => x.text === q.text)) list.push(q)
    }
  }
  return list.slice(0, want)
}

// 为一道题生成 n 个候选答案（含正确答案），混入 ±10 的典型错误
export function makeChoices(q, n = 4) {
  const ans = q.answer
  const set = new Set([String(ans)])
  const out = []
  let guard = 0
  while (out.length < n - 1 && guard < 300) {
    guard++
    let cand
    const roll = Math.random()
    if (roll < 0.25) cand = ans + (Math.random() < 0.5 ? 10 : -10)
    else if (roll < 0.4) cand = ans + (Math.random() < 0.5 ? 1 : -1)
    else cand = ans + ri(2, Math.max(5, Math.abs(ans) + 3)) * (Math.random() < 0.5 ? 1 : -1)
    if (cand < 0) continue
    const s = String(cand)
    if (set.has(s)) continue
    set.add(s)
    out.push(s)
  }
  let bump = 11
  while (out.length < n - 1) out.push(String(ans + bump++))
  const all = [String(ans), ...out]
  for (let i = all.length - 1; i > 0; i--) {
    const j = ri(0, i)
    const t = all[i]
    all[i] = all[j]
    all[j] = t
  }
  return all
}

export function fmtDuration(ms) {
  const total = Math.max(0, Math.round((ms || 0) / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}
