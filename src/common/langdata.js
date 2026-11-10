// 语文 & 英语题库（纯本地内置，随机抽题 + 自动生成干扰项）
// 生成器统一返回 { text, answer, type: 'choice', options: [4个选项，乱序] }

function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pickOne(arr) {
  return arr[ri(0, arr.length - 1)]
}
function shuffled(a) {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = r[i]
    r[i] = r[j]
    r[j] = t
  }
  return r
}

// 生成一道四选一选择题
function mkChoice(text, answer, pool) {
  const set = new Set([answer])
  const opts = [answer]
  let guard = 0
  while (opts.length < 4 && guard < 300) {
    guard++
    const d = pickOne(pool)
    if (!set.has(d)) {
      set.add(d)
      opts.push(d)
    }
  }
  let fi = 0
  const fillers = ['①', '②', '③', '④', '⑤']
  while (opts.length < 4) opts.push(String(answer) + (fillers[fi++] || fi))
  return { text, answer, type: 'choice', options: shuffled(opts) }
}

/* ================= 语文 ================= */

const OPP = [
  ['大', '小'], ['多', '少'], ['上', '下'], ['左', '右'], ['前', '后'],
  ['开', '关'], ['来', '去'], ['高', '矮'], ['长', '短'], ['黑', '白'],
  ['快', '慢'], ['远', '近'], ['里', '外'], ['东', '西'], ['南', '北'],
  ['冷', '热'], ['哭', '笑'], ['好', '坏'], ['新', '旧'], ['早', '晚'],
  ['升', '降'], ['买', '卖'], ['借', '还'], ['进', '出']
]
export function cnOpp() {
  const [w, ant] = pickOne(OPP)
  const pool = OPP.flat().filter((x) => x !== w && x !== ant)
  return mkChoice(`「${w}」的反义词是？`, ant, pool)
}

const SYN2 = [
  ['美丽', '漂亮'], ['高兴', '开心'], ['立刻', '马上'], ['帮助', '帮忙'],
  ['著名', '有名'], ['十分', '非常'], ['突然', '忽然'], ['保护', '爱护'],
  ['难过', '伤心'], ['专心', '认真'], ['原来', '本来'], ['中心', '中央'],
  ['想法', '主意'], ['平时', '平常'], ['特殊', '特别'], ['安静', '宁静'],
  ['明亮', '透亮'], ['着急', '焦急'], ['有名', '出名'], ['望', '看']
]
export function cnSyn() {
  const [w, syn] = pickOne(SYN2)
  const pool = SYN2.flat().filter((x) => x !== w && x !== syn)
  return mkChoice(`「${w}」的近义词是？`, syn, pool)
}

const MEAS = [
  ['鸟', '只'], ['河', '条'], ['山', '座'], ['花', '朵'], ['书', '本'],
  ['伞', '把'], ['牛', '头'], ['马', '匹'], ['飞机', '架'], ['车', '辆'],
  ['树', '棵'], ['星星', '颗'], ['鱼', '条'], ['衣服', '件'], ['鞋', '双'],
  ['画', '幅'], ['桥', '座'], ['井', '口'], ['戏', '场'], ['刀', '把'],
  ['纸', '张'], ['珍珠', '颗'], ['帽子', '顶'], ['琴', '台']
]
export function cnMeas() {
  const [noun, m] = pickOne(MEAS)
  const pool = [...new Set(MEAS.map((x) => x[1]))].filter((x) => x !== m)
  return mkChoice(`一（　）${noun}？`, m, pool)
}

const PINYIN = [
  ['花', 'huā'], ['鸟', 'niǎo'], ['水', 'shuǐ'], ['火', 'huǒ'], ['月', 'yuè'],
  ['山', 'shān'], ['石', 'shí'], ['田', 'tián'], ['竹', 'zhú'], ['叶', 'yè'],
  ['风', 'fēng'], ['雨', 'yǔ'], ['雪', 'xuě'], ['云', 'yún'], ['虫', 'chóng'],
  ['鱼', 'yú'], ['马', 'mǎ'], ['牛', 'niú'], ['羊', 'yáng'], ['耳', 'ěr'],
  ['目', 'mù'], ['手', 'shǒu'], ['足', 'zú'], ['日', 'rì'], ['火', 'huǒ'],
  ['木', 'mù'], ['金', 'jīn'], ['土', 'tǔ'], ['米', 'mǐ'], ['瓜', 'guā']
]
export function cnPinyin() {
  const [ch, py] = pickOne(PINYIN)
  const pool = PINYIN.map((x) => x[1]).filter((x) => x !== py)
  return mkChoice(`「${ch}」的正确读音是？`, py, pool)
}

const POEMS = [
  ['床前明月＿', '光'], ['疑是地上＿', '霜'], ['低头思＿', '故乡'],
  ['春眠不觉＿', '晓'], ['处处闻啼＿', '鸟'], ['夜来风雨＿', '声'],
  ['花落知＿', '少'], ['锄禾日当＿', '午'], ['汗滴禾下＿', '土'],
  ['谁知盘中＿', '餐'], ['粒粒皆辛＿', '苦'], ['白毛浮绿＿', '水'],
  ['红掌拨清＿', '波'], ['曲项向＿歌', '天'], ['欲穷千里＿', '目'],
  ['更上一层＿', '楼'], ['红豆生南＿', '国'], ['春来发几＿', '枝'],
  ['小时不识＿', '月'], ['呼作白玉＿', '盘'], ['远上寒山石径＿', '斜'],
  ['白云生处有人＿', '家'], ['停车坐爱枫林＿', '晚'], ['霜叶红于二月＿', '花'],
  ['离离原上＿', '草'], ['一岁一枯＿', '荣'], ['野火烧不＿', '尽'],
  ['春风吹又＿', '生']
]
export function cnPoem() {
  const [line, ans] = pickOne(POEMS)
  const pool = POEMS.map((x) => x[1]).filter((x) => x !== ans)
  return mkChoice(`补诗句：“${line}”`, ans, pool)
}

const IDIOMS = [
  ['一（　）当先', '马'], ['（　）暖花开', '春'], ['山（　）水尽', '穷'],
  ['一鸣（　）人', '惊'], ['画蛇添（　）', '足'], ['守株待（　）', '兔'],
  ['亡羊补（　）', '牢'], ['拔（　）助长', '苗'], ['掩耳盗（　）', '铃'],
  ['自相（　）盾', '矛'], ['刻舟求（　）', '剑'], ['井底之（　）', '蛙'],
  ['全神（　）注', '贯'], ['温故知（　）', '新'], ['水滴（　）穿', '石'],
  ['（　）竿见影', '立'], ['（　）木逢春', '枯'], ['（　）口同声', '异'],
  ['（　）襟坐正', '正'], ['（　）人善听', '虚']
]
export function cnIdiom() {
  const [line, ans] = pickOne(IDIOMS)
  const pool = IDIOMS.map((x) => x[1]).filter((x) => x !== ans)
  return mkChoice(`补成语：${line}`, ans, pool)
}

/* ================= 英语 ================= */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function enLetter() {
  const kind = ri(0, 2)
  if (kind === 0) {
    // 小写 -> 大写
    const i = ri(0, 25)
    const pool = ALPHABET.filter((x) => x !== ALPHABET[i])
    return mkChoice(`${ALPHABET[i].toLowerCase()} 的大写字母是？`, ALPHABET[i], pool)
  }
  if (kind === 1) {
    // 大写 -> 小写
    const i = ri(0, 25)
    const pool = ALPHABET.map((x) => x.toLowerCase()).filter((x) => x !== ALPHABET[i].toLowerCase())
    return mkChoice(`${ALPHABET[i]} 的小写字母是？`, ALPHABET[i].toLowerCase(), pool)
  }
  // 字母顺序
  const i = ri(0, 22)
  const ans = ALPHABET[i + 3]
  const pool = ALPHABET.filter((x) => x !== ans)
  return mkChoice(`按顺序：${ALPHABET[i]} ${ALPHABET[i + 1]} ${ALPHABET[i + 2]} ＿`, ans, pool)
}

const PIC_WORDS = [
  ['🍎', 'apple'], ['🐱', 'cat'], ['🐶', 'dog'], ['☀️', 'sun'], ['📖', 'book'],
  ['🐟', 'fish'], ['🚗', 'car'], ['🌳', 'tree'], ['⚽', 'ball'], ['🥛', 'milk'],
  ['🥚', 'egg'], ['🚌', 'bus'], ['✏️', 'pen'], ['🐦', 'bird'], ['🍰', 'cake'],
  ['⭐', 'star'], ['🌙', 'moon'], ['🌧️', 'rain'], ['✋', 'hand'], ['🐷', 'pig'],
  ['🦆', 'duck'], ['🏠', 'house'], ['📦', 'box'], ['🍌', 'banana'], ['🚲', 'bike'],
  ['🐭', 'mouse'], ['🐻', 'bear'], ['👗', 'dress'], ['👞', 'shoe'], ['🔔', 'bell']
]
export function enWordPic() {
  const [emoji, word] = pickOne(PIC_WORDS)
  const pool = PIC_WORDS.map((x) => x[1]).filter((x) => x !== word)
  return mkChoice(`${emoji} 的英文是？`, word, pool)
}

const WORDS = [
  ['apple', '苹果'], ['cat', '猫'], ['dog', '狗'], ['sun', '太阳'], ['book', '书'],
  ['fish', '鱼'], ['car', '汽车'], ['tree', '树'], ['ball', '球'], ['milk', '牛奶'],
  ['egg', '鸡蛋'], ['bus', '公交车'], ['pen', '钢笔'], ['bird', '鸟'], ['cake', '蛋糕'],
  ['star', '星星'], ['moon', '月亮'], ['rain', '雨'], ['hand', '手'], ['water', '水'],
  ['teacher', '老师'], ['student', '学生'], ['school', '学校'], ['family', '家庭'],
  ['friend', '朋友'], ['red', '红色'], ['blue', '蓝色'], ['seven', '七'], ['eight', '八'],
  ['big', '大的'], ['small', '小的'], ['tiger', '老虎'], ['panda', '熊猫'], ['rice', '米饭']
]
export function enWordMean() {
  const [w, cn] = pickOne(WORDS)
  const pool = WORDS.map((x) => x[1]).filter((x) => x !== cn)
  return mkChoice(`${w} 的意思是？`, cn, pool)
}

const MISSING_POOL = WORDS.filter((x) => x[0].length >= 3)
export function enMissing() {
  const [w, cn] = pickOne(MISSING_POOL)
  const i = ri(1, w.length - 1) // 首字母不挖空，降低难度
  const ans = w[i]
  const text = w.slice(0, i) + '_' + w.slice(i + 1)
  const pool = ALPHABET.map((x) => x.toLowerCase()).filter((x) => x !== ans.toLowerCase())
  return mkChoice(`${text}（${cn}）缺的字母是？`, ans, pool)
}

const GRAMMAR = [
  ['I ___ a student.', 'am', ['is', 'are', 'be']],
  ['He ___ my brother.', 'is', ['am', 'are', 'be']],
  ['They ___ teachers.', 'are', ['is', 'am', 'be']],
  ['___ you happy?', 'Are', ['Is', 'Am', 'Be']],
  ['This is ___ apple.', 'an', ['a', 'the', 'two']],
  ['I have ___ pen.', 'a', ['an', 'the', 'two']],
  ['___ is your name?', 'What', ['Where', 'Who', 'How']],
  ['___ do you live?', 'Where', ['What', 'Who', 'When']],
  ['___ is that boy?', 'Who', ['What', 'Where', 'How']],
  ['How ___ you? I am fine.', 'are', ['is', 'am', 'be']],
  ['There ___ three books.', 'are', ['is', 'am', 'be']],
  ['___ is the weather? It is sunny.', 'How', ['What', 'Where', 'Who']]
]
export function enGrammar() {
  const [sentence, ans, pool] = pickOne(GRAMMAR)
  return mkChoice(`选词填空：${sentence}`, ans, pool)
}
