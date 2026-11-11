// 乐喵式学段知识点体系：启蒙 → 成长 → 提高 → 进阶 → 跨越 → 培优 → 精英
// 结构：学段 stage → 级别 level → 单元 unit → 知识点 point → 练习模式（趣味互动/智能测验）
// 知识点数量 300+，参考乐喵「模板 × 难度档 tier」方式参数化出题

import { lemiaoAct } from './lemiao.js'

/* ---------------- 出题小工具 ---------------- */
function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[ri(0, arr.length - 1)]
}
function symOf(diff) {
  return diff > 0 ? '>' : diff < 0 ? '<' : '='
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
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(0, i)
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}
function q(text, answer, extra) {
  return Object.assign({ text, answer }, extra || {})
}
function numOpts(ans, deltas) {
  const dl = deltas || [1, 2, 10, -1, -10]
  const set = new Set([String(ans)])
  const out = []
  let guard = 0
  while (out.length < 3 && guard < 200) {
    guard++
    const cand = ans + pick(dl)
    if (cand < 0 || set.has(String(cand))) continue
    set.add(String(cand))
    out.push(String(cand))
  }
  let bump = 3
  while (out.length < 3) out.push(String(ans + bump++))
  return shuffle([String(ans), ...out])
}
function textOpts(ans, wrongs) {
  return shuffle([ans, ...wrongs.slice(0, 3)])
}
// 引用乐喵题卡出题器
function L(actKey) {
  const a = lemiaoAct(actKey)
  return a ? a.gen : () => q('1 + 1', 2)
}

/* ---------------- 参数化出题器 ---------------- */
const G = {
  // 数数 / 认数
  cnt: (lo, hi, e) => () => { const n = ri(lo, hi); return q(`一共有几个？`, n, { visual: { kind: 'dots', icon: e, n } }) },
  pair: (lo, hi) => () => { const n = ri(lo, hi); const e = pick(['🍎', '🍬', '⭐', '🎈']); return q(`哪个数字和 ${e.repeat(n)} 一样多？`, n, { type: 'choice', options: numOpts(n, [1, 2, -1]) }) },
  seq: (lo, step, n = 3) => () => { const s = ri(lo, lo + 20); const arr = Array.from({ length: n }, (_, i) => s + i * step); return q(`照样子接着写：${arr.join('、')}、？`, s + n * step) },
  hunt: (base, spread) => () => { const opts = [base, base + ri(1, spread), base - ri(1, spread), base + ri(spread + 1, spread * 2)]; return q(`找出比 ${base} 大的数`, String(Math.max(...opts)), { type: 'choice', options: shuffle(opts.map(String)) }) },
  neighbor: () => () => { const n = ri(2, 98); if (Math.random() < 0.5) return q(`${n} 的前一个数是几？`, n - 1); return q(`${n} 的后一个数是几？`, n + 1) },
  // 比较 / 排序 / 判断
  cmpN: (max) => () => { let a = ri(0, max), b = ri(0, max); if (Math.random() < 0.15) b = a; return q(`${a} ○ ${b}`, symOf(a - b), { type: 'compare' }) },
  cmpCnt: () => () => { const a = ri(2, 9), b = ri(2, 9); if (Math.random() < 0.2) return q(`${'🍎'.repeat(a)} ○ ${'🍎'.repeat(a)}`, '=', { type: 'compare' }); return q(`${'🍎'.repeat(a)} ○ ${'🍎'.repeat(b)}`, symOf(a - b), { type: 'compare' }) },
  ordN: (lo, hi) => () => { const s = shuffle([ri(lo, hi), ri(lo, hi), ri(lo, hi), ri(lo, hi)]); const wantMax = Math.random() < 0.5; const ans = wantMax ? Math.max(...s) : Math.min(...s); return q(`${s.join('、')} 中${wantMax ? '最大' : '最小'}的是？`, ans, { type: 'choice', options: shuffle([...new Set(s.map(String))]) }) },
  sizeCmp: () => () => { const p = pick([['🐘', '大象'], ['🐭', '老鼠'], ['🌳', '大树'], ['🌱', '小草'], ['🏔️', '高山']]); const ok = Math.random() < 0.5; return q(`大象比${p[1]}大`, ok ? '√' : '×', { type: 'judge' }) },
  // 加减
  add: (max) => () => { const a = ri(1, max - 1); const b = ri(1, max - a); return q(`${a} + ${b}`, a + b) },
  add5: (lo, hi) => () => { const a = ri(lo, hi - 1); const b = ri(1, hi - a); return q(`${a} + ${b}`, a + b) },
  sub: (max) => () => { const a = ri(2, max); const b = ri(1, a); return q(`${a} - ${b}`, a - b) },
  subFrom: (base) => () => { const b = ri(1, base); return q(`${base} - ${b}`, base - b) },
  zeroAdd: () => () => { const a = ri(1, 20); if (Math.random() < 0.5) return q(`${a} + 0`, a); return q(`${a} - 0`, a) },
  swap: () => () => { const a = ri(1, 9), b = ri(1, 9); const s = a + b; return q(`因为 ${a} + ${b} = ${s}，所以 ${b} + ？ = ${s}`, a) },
  inverse: () => () => { const a = ri(1, 9), b = ri(1, 9); const s = a + b; return q(`${a} + ${b} = ${s}，所以 ${s} - ？ = ${a}`, b) },
  addSub: (max) => () => (Math.random() < 0.5 ? G.add(max)() : G.sub(max)()),
  chain: (max) => () => { const a = ri(2, Math.floor(max / 3)); const b = ri(2, Math.floor(max / 3)); const c = ri(1, max - a - b); return q(`${a} + ${b} + ${c}`, a + b + c) },
  chainSub: (max) => () => { const a = ri(Math.floor(max / 2), max); const b = ri(1, a - 2); const c = ri(1, a - b - 1); return q(`${a} - ${b} - ${c}`, a - b - c) },
  missAdd: (max) => () => { const s = ri(2, max); const a = ri(1, s - 1); return q(`${a} + ? = ${s}`, s - a, { visual: { kind: 'dots', icon: pick(['🍎', '⭐', '🍬']), n: s } }) },
  missSub: (max) => () => { const a = ri(3, max); const c = ri(1, a - 1); return q(`${a} - ? = ${c}`, a - c) },
  judge: (max) => () => { const isAdd = Math.random() < 0.5; let val, l, r; if (isAdd) { l = ri(1, max - 1); r = ri(1, max - l); val = l + r } else { l = ri(2, max); r = ri(1, l); val = l - r } const ok = Math.random() < 0.5; let shown = val; if (!ok) { shown = Math.max(0, val + pick([-3, -2, -1, 1, 2, 3])); if (shown === val) shown = val + 2 } return q(`${l} ${isAdd ? '+' : '-'} ${r} = ${shown}`, ok ? '√' : '×', { type: 'judge' }) },
  // 进退位 / 竖式
  noCarry: () => () => { let a, b; do { a = ri(11, 88); b = ri(1, 9) } while ((a % 10) + b >= 10); return q(`${a} + ${b}`, a + b) },
  carry2: () => () => { let a, b; do { a = ri(12, 89); b = ri(1, 9) } while ((a % 10) + b < 10); return q(`${a} + ${b}`, a + b) },
  carry22: () => () => { let a, b; do { a = ri(11, 88); b = ri(11, 99 - a) } while ((a % 10) + (b % 10) < 10); return q(`${a} + ${b}`, a + b) },
  noBorrow: () => () => { let a, b; do { a = ri(15, 99); b = ri(1, 9) } while (a % 10 < b); return q(`${a} - ${b}`, a - b) },
  borrow2: () => () => { let a, b; do { a = ri(20, 99); b = ri(1, 9) } while (a % 10 >= b); return q(`${a} - ${b}`, a - b) },
  borrow22: () => () => { let a, b; do { a = ri(25, 99); b = ri(11, a - 5) } while (a % 10 >= b % 10); return q(`${a} - ${b}`, a - b) },
  int10: () => () => { const a = ri(2, 9) * 10; const b = ri(1, a / 10 - 1) * 10; return Math.random() < 0.5 ? q(`${a} + ${b}`, a + b) : q(`${a} - ${b}`, a - b) },
  int100: () => () => { const a = ri(1, 9) * 100; const b = ri(1, 9) * 100; return Math.random() < 0.5 ? q(`${a} + ${b}`, a + b) : q(`${a} - ${b}`, a - b) },
  add3: () => () => { const a = ri(105, 899); const b = ri(105, 999 - a); return q(`${a} + ${b}`, a + b) },
  sub3: () => () => { const a = ri(305, 999); const b = ri(105, a - 100); return q(`${a} - ${b}`, a - b) },
  carry3: () => () => { let a, b; do { a = ri(105, 899); b = ri(15, 99) } while ((a % 10) + (b % 10) < 10); return q(`${a} + ${b}`, a + b) },
  borrow3: () => () => { let a, b; do { a = ri(115, 999); b = ri(11, 99) } while (a % 10 >= b % 10 || a - b < 10); return q(`${a} - ${b}`, a - b) },
  contBorrow: () => () => { let a, b; do { a = ri(200, 999); b = ri(11, 99) } while (a % 10 >= b % 10 || Math.floor(a / 10) % 10 <= Math.floor(b / 10) % 10); return q(`${a} - ${b}`, a - b) },
  colAdd: (r) => () => { let a, b; do { a = ri(r[0], r[1]); b = ri(r[2], r[3]) } while ((a % 10) + (b % 10) < 10); return q(`${a} + ${b}`, a + b) },
  colSub: (r) => () => { let a, b; do { a = ri(r[0], r[1]); b = ri(r[2], r[3]) } while (a % 10 >= b % 10 || a - b < 1); return q(`${a} - ${b}`, a - b) },
  colNoCarry: (r) => () => { let a, b; do { a = ri(r[0], r[1]); b = ri(r[2], r[3]) } while ((a % 10) + (b % 10) >= 10); return q(`${a} + ${b}`, a + b) },
  colNoBorrow: (r) => () => { let a, b; do { a = ri(r[0], r[1]); b = ri(r[2], r[3]) } while (a % 10 < b % 10); return q(`${a} - ${b}`, a - b) },
  // 乘除
  mulT: (t) => () => { const b = ri(2, 9); return q(`${t} × ${b}`, t * b) },
  mul: (aMax, bMax) => () => { const a = ri(2, aMax), b = ri(2, bMax); return q(`${a} × ${b}`, a * b) },
  mulChoice: () => () => { const a = ri(2, 9), b = ri(2, 9); return q(`${a} × ${b} = ？`, a * b, { type: 'choice', options: numOpts(a * b, [a, b, 10, -a]) }) },
  div: (bMax, qMax) => () => { const b = ri(2, bMax), qt = ri(2, qMax); return q(`${b * qt} ÷ ${b}`, qt) },
  divChoice: () => () => { const b = ri(2, 9), qt = ri(2, 9); return q(`${b * qt} ÷ ${b} = ？`, qt, { type: 'choice', options: numOpts(qt, [1, 2, -1]) }) },
  mulAddSub: () => () => { const a = ri(2, 9), b = ri(2, 9), c = ri(1, 20); return Math.random() < 0.5 ? q(`${a} × ${b} + ${c}`, a * b + c) : q(`${a} × ${b} - ${c}`, a * b - c) },
  factor: () => () => { const a = ri(2, 9), b = ri(2, 9); return q(`${a * b} = ${a} × ？`, b, { type: 'choice', options: numOpts(b, [1, 2, -1]) }) },
  mulColNo: () => () => { let a, b; do { a = ri(11, 29); b = ri(2, 4) } while ((a % 10) * b >= 10 && Math.floor(a / 10) * b >= 10); return q(`${a} × ${b}`, a * b) },
  mulColCarry: () => () => { const a = ri(23, 98), b = ri(3, 9); return q(`${a} × ${b}`, a * b) },
  colDiv: (two) => () => { const b = ri(2, 9); const qt = two ? ri(11, 99) : ri(2, 9); return q(`${b * qt} ÷ ${b}`, qt) },
  divRem: () => () => { const b = ri(3, 9), qt = ri(1, 9), r = ri(1, b - 1); const a = b * qt + r; return Math.random() < 0.5 ? q(`${a} ÷ ${b} = ? 余 ${r}`, qt) : q(`${a} ÷ ${b} = ${qt} 余 ?`, r) },
  divRemApp: () => () => { const b = ri(3, 6), qt = ri(2, 6), r = ri(1, b - 1); const a = b * qt + r; return q(`${a} 个苹果每 ${b} 个装一袋，最多装满几袋？`, qt) },
  mix4: () => () => { const t = pick(['a', 'b', 'c', 'd']); if (t === 'a') { const a = ri(2, 9), b = ri(2, 9), c = ri(1, 20); return q(`${a} × ${b} + ${c}`, a * b + c) } if (t === 'b') { const a = ri(1, 20), b = ri(2, 9), c = ri(2, 9); return q(`${a} + ${b} × ${c}`, a + b * c) } if (t === 'c') { const a = ri(1, 20), b = ri(1, 20), c = ri(2, Math.min(9, Math.floor(100 / (a + b)) || 2)); return q(`(${a} + ${b}) × ${c}`, (a + b) * c) } const b = ri(2, 9), qt = ri(1, 9), c = ri(1, 20); return q(`${b * qt} ÷ ${b} + ${c}`, qt + c) },
  bracket: () => () => { const a = ri(1, 9), b = ri(1, 9); const c = ri(2, 9); return Math.random() < 0.5 ? q(`(${a} + ${b}) × ${c}`, (a + b) * c) : q(`${a * 10 + b} - ${a} × ${b}`, a * 10 + b - a * b) },
  // 位值 / 数的表示
  compose: (maxH) => () => { const h = ri(1, maxH), t = ri(1, 9), o = ri(1, 9); return q(`${h} 个百、${t} 个十、${o} 个一组成？`, h * 100 + t * 10 + o) },
  compose2: () => () => { const t = ri(1, 9), o = ri(1, 9); return q(`${t} 个十和 ${o} 个一组成？`, t * 10 + o) },
  expand: () => () => { const h = ri(1, 9), t = ri(1, 9), o = ri(1, 9); const n = h * 100 + t * 10 + o; const part = pick(['t', 'o']); return part === 't' ? q(`${n} = ${h * 100} + ? + ${o}`, t * 10) : q(`${n} = ${h * 100} + ${t * 10} + ?`, o) },
  digitVal: () => () => { const h = ri(1, 9), t = ri(1, 9), o = ri(1, 9); const n = h * 100 + t * 10 + o; const pos = pick(['h', 't', 'o']); const dig = pos === 'h' ? h : pos === 't' ? t : o; const val = pos === 'h' ? dig * 100 : pos === 't' ? dig * 10 : dig; return q(`${n} 中的 ${dig} 表示多少？`, val, { type: 'choice', options: numOpts(val, [dig, 10, 1]) }) },
  bigNum: () => () => { const w = ri(1, 9), y = ri(1, 9), qn = ri(1, 9), b = ri(1, 9), s = ri(1, 9), g = ri(1, 9); const n = w * 10000 + y * 1000 + qn * 100 + b * 10 + s; if (Math.random() < 0.5) return q(`读数：${n} 中的 ${y} 在哪一位？`, '万位', { type: 'choice', options: ['万位', '千位', '十万位', '百位'] }); return q(`${w} 万 ${y} 千组成？`, w * 10000 + y * 1000) },
  bigRead: () => () => { const n = ri(10000, 999999); return q(`${n} 的最高位是什么位？`, n >= 100000 ? '十万位' : '万位', { type: 'choice', options: ['万位', '十万位', '千位', '百万位'] }) },
  roundN: () => () => { const n = ri(105, 995); const o = n % 10; const base = Math.floor(n / 10) * 10; return q(`把 ${n} 四舍五入到十位`, o >= 5 ? base + 10 : base) },
  round100: () => () => { const n = ri(1050, 9950); const o = n % 100; const base = Math.floor(n / 100) * 100; return q(`把 ${n} 四舍五入到百位`, o >= 50 ? base + 100 : base) },
  estimate: () => () => { const a = ri(21, 89), b = ri(21, 89); return q(`${a} + ${b} ≈ ？（先取整十）`, Math.round(a / 10) * 10 + Math.round(b / 10) * 10) },
  // 图形
  shapeName: () => () => { const sh = pick([['🔺', '三角形'], ['🟦', '正方形'], ['⭕', '圆形'], ['▭', '长方形']]); const wrongs = ['三角形', '正方形', '圆形', '长方形'].filter((x) => x !== sh[1]); return q(`${sh[0]} 是什么形状？`, sh[1], { type: 'choice', options: textOpts(sh[1], wrongs) }) },
  shapeCount: () => () => { const s = pick([['三角形', 3], ['正方形', 4], ['五边形', 5], ['六边形', 6]]); const askSide = Math.random() < 0.5; return q(`${s[0]}有几条${askSide ? '边' : '个角'}？`, s[1], { type: 'choice', options: numOpts(s[1], [1, 2, -1]) }) },
  angle: () => () => { const deg = ri(10, 170); const ans = deg < 90 ? '锐角' : deg === 90 ? '直角' : '钝角'; const wrongs = ['锐角', '直角', '钝角'].filter((x) => x !== ans); return q(`一个角是 ${deg}°，它是什么角？`, ans, { type: 'choice', options: textOpts(ans, wrongs) }) },
  threeD: () => () => { const s = pick([['正方体', 6, '面'], ['正方体', 12, '条棱'], ['长方体', 6, '面'], ['圆柱', 2, '个底面']]); return q(`${s[0]}有几个${s[2]}？`, s[1], { type: 'choice', options: numOpts(s[1], [1, 2, -1]) }) },
  perimeter: () => () => { const l = ri(3, 15), w = ri(1, l - 1); return q(`长 ${l} 厘米、宽 ${w} 厘米的长方形，周长是多少厘米？`, 2 * (l + w)) },
  area: () => () => { const l = ri(3, 15), w = ri(2, l); return q(`长 ${l} 厘米、宽 ${w} 厘米的长方形，面积是多少平方厘米？`, l * w) },
  barGraph: () => () => { const names = shuffle([['🍎', '苹果'], ['🍐', '梨'], ['🍌', '香蕉'], ['🍊', '橙子']]).slice(0, 2); const a = ri(3, 12), b = ri(1, a - 1); return q(`${names[0][0]} 有 ${a} 个，${names[1][0]} 有 ${b} 个，${names[0][1]} 比 ${names[1][1]}多几个？`, a - b, { type: 'choice', options: numOpts(a - b, [1, 2, -1]) }) },
  average: () => () => { const p = ri(2, 6), each = ri(2, 9); return q(`${p * each} 块饼干平均分给 ${p} 人，每人几块？`, each) },
  // 计量 / 生活
  unit: (tables) => () => { const t = pick(tables); const n = ri(t[3], t[4]); if (Math.random() < 0.5) return q(`${n} ${t[0]} = ？${t[1]}`, n * t[2]); return q(`${n * t[2]} ${t[1]} = ？${t[0]}`, n) },
  clock: () => () => { if (Math.random() < 0.5) { const h = ri(1, 12); return q(`时针指向 ${h}，分针指向 12，是几时？`, h) } const h = ri(1, 10), add = ri(1, 12 - h); return q(`${h} 时再过 ${add} 小时是几时？`, h + add) },
  clockMin: () => () => { const h = ri(1, 12), m = pick([15, 30, 45]); return q(`时针过了 ${h}，分针指向 ${m} 分的位置，是 ${h} 时几分？`, m, { type: 'choice', options: numOpts(m, [5, 10, -5]) }) },
  money: () => () => { const t = pick([['10 元可以换几张 5 元？', 2], ['10 元可以换几张 2 元？', 5], ['10 元可以换几张 1 元？', 10], ['5 元可以换几个 1 元？', 5], ['1 元可以换几个 5 角？', 2], ['1 元可以换几个 2 角？', 5]]); return q(t[0], t[1]) },
  moneyBuy: () => () => { const price = ri(3, 9), n = ri(2, 5); const pay = ri(Math.ceil((price * n + 1) / 10), Math.ceil((price * n + 1) / 10) + 3) * 10; return q(`每本本子 ${price} 元，买 ${n} 本，付了 ${pay} 元，找回几元？`, pay - price * n) },
  ruler: () => () => { const s = ri(1, 5), e = s + ri(2, 8); return q(`铅笔一端对准 ${s} 厘米，另一端对准 ${e} 厘米，铅笔长几厘米？`, e - s) },
  mass: () => () => { const t = pick([['千克', '克', 1000, 1, 9], ['吨', '千克', 1000, 1, 9]]); const n = ri(t[3], t[4]); return q(`${n} ${t[0]} = ？${t[1]}`, n * t[2]) },
  // 规律 / 推理
  pattern: (step, lo) => () => { const s = ri(lo || 1, 20); const arr = [s, s + step, s + 2 * step, s + 3 * step]; return q(`${arr.join('、')}、？ 按规律填数`, s + 4 * step, { type: 'choice', options: numOpts(s + 4 * step, [1, 2, step]) }) },
  patternMul: () => () => { const s = ri(1, 4), m = pick([2, 3]); const arr = [s, s * m, s * m * m, s * m * m * m]; return q(`${arr.join('、')}、？`, s * m * m * m * m, { type: 'choice', options: numOpts(s * m * m * m * m, [m, s, 10]) }) },
  oddEven: () => () => { const n = ri(10, 99); const callEven = Math.random() < 0.5; const isEven = n % 2 === 0; return q(`${n} 是${callEven ? '偶数' : '奇数'}`, callEven === isEven ? '√' : '×', { type: 'judge' }) },
  substitute: () => () => { const a = ri(2, 9), b = ri(1, 9); const s = a + b; return q(`△ = ${a}，△ + ○ = ${s}，○ = ？`, b, { type: 'choice', options: numOpts(b, [1, 2, a]) }) },
  picture: () => () => { const a = ri(2, 9); return q(`🍎 + 🍎 = ${a * 2}，🍎 = ？`, a) },
  arrayLogic: () => () => { const a = ri(1, 9), b = ri(1, 9); const s = a + b + ri(3, 12); return q(`三个数的和是 ${s}：${a}、${b}、？`, s - a - b) },
  gridLoc: () => () => { const c = ri(1, 5), r = ri(1, 5); const ok = Math.random() < 0.5; const sc = ok ? c : pick([c + 1, c - 1 || c + 2, c]); const sr = ok ? r : pick([r + 1, r - 1 || r + 2, r]); return q(`宝藏在第 ${c} 列第 ${r} 行，记作 (${sc},${sr})`, ok || (sc === c && sr === r) ? '√' : '×', { type: 'judge' }) },
  word: () => () => { const price = ri(3, 9), n = ri(2, 6); const pay = price * n + ri(1, 9); return q(`每支笔 ${price} 元，买 ${n} 支付了 ${pay} 元，找回几元？`, pay - price * n) },
  wordSpeed: () => () => { const v = ri(30, 80), t = ri(2, 6); return q(`小汽车每小时行 ${v} 千米，行 ${t} 小时共行多少千米？`, v * t) },
  // 小数 / 分数
  dec: (dot, places) => () => { const d = places; const isAdd = Math.random() < 0.5; if (isAdd) { const a = ri(1, 499) / d, b = ri(1, 499) / d; return q(`${a.toFixed(dot)} + ${b.toFixed(dot)}`, Number((a + b).toFixed(dot + 1)), { dot: true }) } const a = ri(20, 999) / d, b = ri(1, a - 0.1); return q(`${a.toFixed(dot)} - ${b.toFixed(dot)}`, Number((a - b).toFixed(dot + 1)), { dot: true }) },
  decRead: () => () => { const n = pick([0.35, 2.6, 0.08, 4.05, 12.7]); const map = { 0.35: '零点三五', 2.6: '二点六', 0.08: '零点零八', 4.05: '四点零五', 12.7: '十二点七' }; const wrongs = Object.values(map).filter((x) => x !== map[n]); return q(`${n} 读作？`, map[n], { type: 'choice', options: textOpts(map[n], wrongs) }) },
  decCmp: () => () => { let a = ri(1, 99) / 10, b = ri(1, 99) / 10; if (Math.random() < 0.15) b = a; return q(`${a.toFixed(1)} ○ ${b.toFixed(1)}`, symOf(a - b), { type: 'compare' }) },
  decMulInt: () => () => { const a = ri(11, 99) / 10, b = ri(2, 9); return q(`${a.toFixed(1)} × ${b}`, Number((a * b).toFixed(2)), { dot: true }) },
  decDivInt: () => () => { const b = ri(2, 9), qt = ri(11, 49) / 10; return q(`${(b * qt).toFixed(1)} ÷ ${b}`, Number(qt.toFixed(1)), { dot: true }) },
  fracMean: () => () => { const d = ri(2, 6), n = ri(1, d - 1); const bar = '🟩'.repeat(n) + '⬜'.repeat(d - n); return q(`${bar} 涂色部分占几分之几？`, fracStr(n, d), { type: 'choice', options: shuffle([fracStr(n, d), fracStr(n, d + 1), fracStr(n + 1, d), fracStr(d - n, d)]) }) },
  fracCmp: () => () => { if (Math.random() < 0.5) { const d = ri(3, 9); let a = ri(1, d - 1), b = ri(1, d - 1); if (Math.random() < 0.15) b = a; return q(`${a}/${d} ○ ${b}/${d}`, symOf(a - b), { type: 'compare' }) } const n = ri(1, 5); const d1 = ri(n + 1, n + 4), d2 = ri(n + 5, n + 8); return q(`${n}/${d1} ○ ${n}/${d2}`, symOf(n / d1 - n / d2), { type: 'compare' }) },
  fracUnit: (d) => () => { const n = ri(1, d - 1); const isAdd = Math.random() < 0.5; if (isAdd) { let b = ri(1, d - n); return q(`${n}/${d} + ${b}/${d}`, fracStr(n + b, d), { type: 'frac' }) } const a = ri(n + 1, d - 1); return q(`${a}/${d} - ${n}/${d}`, fracStr(a - n, d), { type: 'frac' }) },
  fracCommon: () => () => { const d1 = ri(2, 6), d2 = d1 * pick([2, 3]); const a = ri(1, d1 - 1); return q(`${a}/${d1} = ?/${d2}`, a * (d2 / d1), { type: 'choice', options: numOpts(a * (d2 / d1), [1, 2, -1]) }) },
  fracMixed: (k) => () => { if (k === 1) { const d = ri(2, 9); let a = ri(1, d - 1), b = ri(1, d - 1); if (b > a) { const t = a; a = b; b = t } return { text: `${a}/${d} - ${b}/${d}`, answer: fracStr(a - b, d), type: 'frac' } } const d1 = ri(2, 6), d2 = d1 * pick([2, 3]); const a = ri(1, d1 - 1), b = ri(1, d2 - 1); return { text: `${a}/${d1} + ${b}/${d2}`, answer: fracStr(a * (d2 / d1) + b, d2), type: 'frac' } },
  fracMulDiv: (isDiv) => () => { if (isDiv) { const n = ri(1, 5), d = ri(n + 1, 9); const k = ri(2, 5); return { text: `${n * k}/${d} ÷ ${k}`, answer: fracStr(n, d), type: 'frac' } } const n = ri(1, 5), d = ri(2, 9), k = ri(2, 5); return { text: `${n}/${d} × ${k}`, answer: fracStr(n * k, d), type: 'frac' } },
  percent: () => () => { const t = pick([['50%', '0.5', ['0.5', '5', '0.05', '50']], ['25%', '0.25', ['0.25', '2.5', '0.4', '25']], ['75%', '0.75', ['0.75', '7.5', '0.7', '75']], ['10%', '0.1', ['0.1', '1', '0.01', '10']]]); return q(`${t[0]} 写成小数是多少？`, t[1], { type: 'choice', options: shuffle(t[2]) }) },
  discount: () => () => { const price = pick([100, 200, 80, 60]); const off = pick([5, 7, 8]); return q(`原价 ${price} 元的商品打 ${off} 折，现价多少元？`, (price * off) / 10) },
  ratio: () => () => { const a = ri(1, 5), b = ri(1, 5); if (a === b) return q(`${a + 1} 和 ${b + 2} 的比是多少？`, `${a + 1}:${b + 2}`, { type: 'choice', options: shuffle([`${a + 1}:${b + 2}`, `${b + 2}:${a + 1}`, `${a + 2}:${b + 1}`, `${a}:${b}`]) }); return q(`${a * 2} 和 ${b * 2} 的比化简后是多少？`, `${a}:${b}`, { type: 'choice', options: shuffle([`${a}:${b}`, `${b}:${a}`, `${a * 2}:${b * 2}`, `${a + 1}:${b + 1}`]) }) },
  circle: () => () => { const r = ri(1, 9); const useC = Math.random() < 0.5; return useC ? q(`圆的半径是 ${r}，直径是多少？`, r * 2) : q(`圆的直径是 ${r * 2}，半径是多少？`, r) },
  equation: () => () => { const a = ri(2, 20), b = ri(2, 20); if (Math.random() < 0.5) return q(`x + ${b} = ${a + b}，x = ？`, a); return q(`${a + b} - x = ${b}，x = ？`, a) },
  negative: () => () => { const a = ri(1, 20), b = ri(a + 1, a + 20); return q(`${a} - ${b} = ？`, a - b) },
  zero: () => () => q('空空的盘子里有几颗糖？', 0),
  posJudge: () => () => { const [txt, ans] = pick([['红绿灯在马路的上方', '√'], ['天空在草地的下面', '√'], ['鱼在天上飞', '×'], ['树根在泥土里', '√'], ['太阳从西边升起', '×']]); return q(txt, ans, { type: 'judge' }) },
  moreChoice: () => () => { const a = ri(3, 9), b = ri(3, 9); if (a === b) return q(`${'🍎'.repeat(a)} 和 ${'⭐'.repeat(a + 1)} 哪边多？`, '⭐', { type: 'choice', options: ['🍎', '⭐', '一样多'] }); return q(`${'🍎'.repeat(a)} 和 ${'⭐'.repeat(b)} 哪边多？`, a > b ? '🍎' : '⭐', { type: 'choice', options: ['🍎', '⭐', '一样多'] }) },
  mulInt10: () => () => { const a = ri(2, 9) * 10, b = ri(2, 9); return q(`${a} × ${b}`, a * b) },
  bracketSub: () => () => { const a = ri(20, 50), b = ri(2, 9), c = ri(2, 9); return q(`${a} - (${b} + ${c})`, a - b - c) },
  periSq: () => () => { const s = ri(2, 15); return q(`正方形的边长是 ${s} 厘米，周长是多少厘米？`, s * 4) },
  round1000: () => () => { const n = ri(10500, 99500); const o = n % 1000; const base = Math.floor(n / 1000) * 1000; return q(`把 ${n} 四舍五入到千位`, o >= 500 ? base + 1000 : base) },
  decMulInt2: () => () => { const a = ri(105, 999) / 100, b = ri(2, 9); return q(`${a.toFixed(2)} × ${b}`, Number((a * b).toFixed(3)), { dot: true }) },
  decDivInt2: () => () => { const b = ri(2, 9), qt = ri(105, 499) / 100; return q(`${(b * qt).toFixed(2)} ÷ ${b}`, Number(qt.toFixed(2)), { dot: true }) },
  areaSq: () => () => { const s = ri(2, 12); return q(`正方形的边长是 ${s} 厘米，面积是多少平方厘米？`, s * s) },
  // —— 配对玩法（左算式右答案，点选连配）
  matchQuestion: (max, n = 4) => () => {
    const pairs = []
    const used = new Set()
    let guard = 0
    while (pairs.length < n && guard < 300) {
      guard++
      let l, r
      const kind = pick(['missA', 'missB', 'missC', 'plain', 'plain'])
      if (kind === 'missA') { const s = ri(2, max); const a = ri(1, s - 1); l = `${a} + ? = ${s}`; r = String(s - a) }
      else if (kind === 'missB') { const s = ri(2, max); const c = ri(1, s - 1); l = `${s} - ? = ${c}`; r = String(s - c) }
      else if (kind === 'missC') { const a = ri(3, max); const c = ri(1, a - 1); l = `? - ${a - c} = ${c}`; r = String(a) }
      else if (Math.random() < 0.5) { const a = ri(1, max - 1); const b = ri(1, max - a); l = `${a} + ${b} =`; r = String(a + b) }
      else { const a = ri(2, max); const b = ri(1, a); l = `${a} - ${b} =`; r = String(a - b) }
      if (used.has(l) || used.has(r)) continue
      used.add(l)
      used.add(r)
      pairs.push({ l, r })
    }
    if (pairs.length < 3) return q('1 + 1', 2)
    return q('把算式和答案配成对', '__match__', { type: 'match', pairs, rights: shuffle(pairs.map((x) => x.r)) })
  },
  // —— 负数
  negAdd: () => () => { const a = ri(2, 15), b = ri(a, a + 15); const t = pick(['a', 'b', 'c']); if (t === 'a') return q(`(-${a}) + ${b}`, b - a); if (t === 'b') return q(`(-${a}) + (-${b})`, -(a + b)); return q(`(-${a}) - ${b}`, -(a + b)) },
  negMul: () => () => { const a = ri(2, 9), b = ri(2, 9); return Math.random() < 0.5 ? q(`(-${a}) × ${b}`, -(a * b)) : q(`(-${a}) × (-${b})`, a * b) },
  // —— 圆与立体
  circleArea: () => () => { const r = ri(1, 9); return q(`圆的半径是 ${r} 厘米（π 取 3.14），面积是多少平方厘米？`, Number((r * r * 3.14).toFixed(2))) },
  circlePeri: () => () => { const r = ri(1, 9); return q(`圆的半径是 ${r} 厘米（π 取 3.14），周长约是多少厘米？`, Number((2 * r * 3.14).toFixed(2))) },
  cubeVol: () => () => { const a = ri(2, 6); return q(`正方体的棱长是 ${a} 厘米，体积是多少立方厘米？`, a * a * a) },
  solidName: () => () => { const s = pick([['🥫', '圆柱'], ['🔺', '三棱锥'], ['🧊', '正方体'], ['⚽', '球']]); const wrongs = ['圆柱', '三棱锥', '正方体', '球'].filter((x) => x !== s[1]); return q(`${s[0]} 像什么立体图形？`, s[1], { type: 'choice', options: textOpts(s[1], wrongs) }) },
  // —— 百分数 / 比例
  percentDiv: () => () => { const per = pick([10, 20, 25, 50]); const ans = ri(2, 30) * 10; return q(`一个数的 ${per}% 是 ${(ans * per) / 100}，这个数是多少？`, ans) },
  interest: () => () => { const p = pick([1000, 2000, 5000, 10000]); const r = pick([1, 2, 3]); const t = ri(1, 2); return q(`本金 ${p} 元，年利率 ${r}%，存 ${t} 年利息多少元？`, (p * r * t) / 100) },
  propJudge: () => () => { const ok = pick([['速度一定，路程和时间成正比例', '√'], ['正方形的边长和周长成正比例', '√'], ['一个人的年龄和身高成正比例', '×'], ['每天读的页数一定，总页数和天数成正比例', '√'], ['长方形面积一定，长和宽成正比例', '×']]); return q(ok[0], ok[1], { type: 'judge' }) },
  ratioApp: () => () => { const a = ri(1, 5), b = ri(a + 1, a + 4); const total = (a + b) * ri(2, 9); return q(`把 ${total} 个苹果按 ${a}:${b} 分给两人，较多的那份是多少个？`, Math.floor((total / (a + b)) * b)) },
  // —— 趣味应用
  plant: () => () => { const d = pick([2, 4, 5]); const k = ri(4, 12); return q(`一条 ${d * k} 米的小路，每隔 ${d} 米种一棵树（两端都种），一共种几棵？`, k + 1) },
  age: () => () => { const c = ri(6, 12); const diff = ri(20, 30); const n = ri(3, 10); return q(`今年小华 ${c} 岁，爸爸 ${c + diff} 岁，${n} 年后爸爸比小华大几岁？`, diff) },
  chicken: () => () => { const c = ri(3, 9), r = ri(2, 8); return q(`鸡和兔共 ${c + r} 个头、${2 * c + 4 * r} 条腿，鸡有几只？`, c) },
  fracWord: () => () => { const d = pick([2, 3, 4, 5]); const k = ri(2, 9); const n = pick([1, 2]); const whole = d * k; return q(`一根绳子 ${whole} 米，用去它的 ${n}/${d}，用去多少米？`, k * n) },
  // —— 图形 / 计算
  triSum: () => () => { const a = ri(30, 80); const b = ri(30, 180 - a - 20); if (Math.random() < 0.5) return q(`三角形两个角是 ${a}° 和 ${b}°，第三个角多少度？`, 180 - a - b); return q(`三角形三个内角的和是 180 度`, '√', { type: 'judge' }) },
  triType: () => () => { const t = pick([['80°、60°、40°', '锐角三角形'], ['90°、45°、45°', '直角三角形'], ['120°、30°、30°', '钝角三角形']]); const wrongs = ['锐角三角形', '直角三角形', '钝角三角形'].filter((x) => x !== t[1]); return q(`三个角是 ${t[0]} 的三角形是什么三角形？`, t[1], { type: 'choice', options: textOpts(t[1], wrongs) }) },
  cubeCount: () => () => { const a = ri(2, 4); return q(`用小正方体摞一个 ${a}×${a}×${a} 的大正方体，一共要几个小的？`, a * a * a) },
  obsJudge: () => () => { const ok = pick([['从上面看一摞硬币，看到的是圆形', '√'], ['从侧面看一个正方体，可能看到长方形', '√'], ['从任何方向看球，看到的都是圆', '√'], ['从正面看圆柱，看到的是圆形', '×']]); return q(ok[0], ok[1], { type: 'judge' }) },
  // —— 计量 / 年月日
  hourUnit: () => () => { const t = pick([['时', '分', 60], ['分', '秒', 60]]); const n = ri(1, 9); return q(`${n} ${t[0]} = ？${t[1]}`, n * t[2]) },
  kmUnit: () => () => { const n = ri(1, 9); return Math.random() < 0.5 ? q(`${n} 千米 = ？米`, n * 1000) : q(`${n * 1000} 米 = ？千米`, n) },
  areaUnit: () => () => { const t = pick([['平方米', '平方分米', 100], ['平方分米', '平方厘米', 100]]); const n = ri(1, 9); return q(`${n} ${t[0]} = ？${t[1]}`, n * t[2]) },
  yearQ: () => () => { const t = pick([['平年二月有多少天？', '28', ['28', '29', '30', '31']], ['闰年二月有多少天？', '29', ['29', '28', '30', '31']], ['平年一年有多少天？', '365', ['365', '366', '360', '362']], ['一年有几个大月（31 天）？', '7', ['7', '6', '5', '4']]]); return q(t[0], t[1], { type: 'choice', options: shuffle(t[2]) }) },
  // —— 低段补充
  tensMore: () => () => { const n = ri(11, 79); return q(`比 ${n} 大 10 的数是多少？`, n + 10) },
  half: () => () => { const n = ri(2, 9) * 2; return q(`${n} 的一半是多少？`, n / 2) },
}

/* ---------------- 结构定义工具 ---------------- */
function P(key, title, desc, g, gen) {
  return { key, title, desc, g, gen }
}
function U(emoji, title, points) {
  return { emoji, title, points }
}
function LV(title, units) {
  return { title, units }
}

/* ---------------- 七大学段 ---------------- */
export const STAGES = [
  {
    key: 'prek', name: '启蒙', icon: '🔔', grades: [7, 1],
    desc: '0-6 岁学龄前 · 一年级零基础，从数数认数开始',
    levels: [
      LV('数一数 认一认', [
        U('🔢', '认识数字 1-5', [
          P('pk-num-1-3', '认识数字 1-3', '数一数小物件，认识 1、2、3', 7, G.cnt(1, 3, '🍎')),
          P('pk-num-0', '认识数字 0', '什么都没有就是 0', 7, G.zero()),
          P('pk-num-4-5', '认识数字 4-5', '继续认识 4 和 5', 7, G.cnt(4, 5, '🍬')),
          P('pk-pair-1-5', '数量配对 1-5', '把物体和数字配起来', 7, G.pair(1, 5)),
          P('pk-hunt-1-5', '寻找数字 1-5', '在一堆数字里找到它', 7, G.hunt(3, 3))
        ]),
        U('🔢', '认识数字 6-10', [
          P('pk-num-6-7', '认识数字 6-7', '继续数更大的数', 7, G.cnt(6, 7, '🎈')),
          P('pk-num-8-9', '认识数字 8-9', '8 和 9 有多少', 7, G.cnt(8, 9, '⭐')),
          P('pk-num-10', '认识数字 10', '数到 10 啦', 7, G.cnt(9, 10, '🍓')),
          P('pk-pair-6-10', '数量配对 6-10', '物体数量和数字配对', 7, G.pair(6, 10)),
          P('pk-pair-10', '数到 10 配对', '满十复习', 7, G.pair(8, 10))
        ]),
        U('✍️', '数字书写与顺序', [
          P('pk-trace-1', '临摹数字 1-20', '照样子接着写数', 7, G.seq(1, 1)),
          P('pk-trace-2', '找规律写数', '每次多 1，接着写', 7, G.seq(11, 1)),
          P('pk-trace-5', '5 个 5 个数', '跳着数数', 7, G.seq(5, 5)),
          P('pk-trace-10', '10 个 10 个数', '整十跳数', 7, G.seq(10, 10)),
          P('pk-hunt-2', '寻找数字', '找出比它大的数', 7, G.hunt(6, 4))
        ])
      ]),
      LV('比一比 分一分', [
        U('⚖️', '多少与大小', [
          P('pk-cmp-more', '比多少', '谁多谁少比一比', 7, G.cmpCnt()),
          P('pk-cmp-same', '一样多吗', '数量相同就是一样多', 7, G.cmpN(9)),
          P('pk-size', '大与小', '大象大还是老鼠大', 7, G.sizeCmp()),
          P('pk-more-choice', '多少选一选', '哪一边的更多', 7, G.moreChoice()),
          P('pk-order-10', '排排队 1-10', '找出最大和最小的数', 7, G.ordN(1, 10))
        ]),
        U('🧩', '图形启蒙', [
          P('pk-shape-round', '圆形认一认', '圆圆的图形是圆', 7, G.shapeName()),
          P('pk-shape-basic', '三角形和正方形', '认识基本图形', 7, G.shapeName()),
          P('pk-shape-count', '数边数角', '数一数图形的边', 7, G.shapeCount()),
          P('pk-shape-trace', '图形临摹', '认出图形的名字', 7, L('shape-tracing')),
          P('pk-shape-sort', '平面还是立体', '立体图形分一分', 7, L('shape-sort-bins'))
        ]),
        U('🗂️', '分类与规律', [
          P('pk-sort', '分类小能手', '把同类的东西放一起', 7, L('shape-sort-bins')),
          P('pk-pair-shape', '图形配对', '找出相同的图形', 7, L('shape-pairing')),
          P('pk-pattern-1', '简单找规律', '下一个是谁', 7, G.pattern(2, 1)),
          P('pk-pos-updown', '上和下', '上下方位判断', 7, G.posJudge()),
          P('pk-pair-shape2', '数字图片配对', '选出正确的数的组成', 1, L('multi-representation-number-match'))
        ])
      ]),
      LV('上学前的准备', [
        U('🧠', '数感准备', [
          P('pk-neighbor', '相邻数', '它的前面和后面是几', 1, G.neighbor()),
          P('pk-neighbor-2', '相邻数进阶', '两位数的邻居', 1, G.neighbor()),
          P('pk-split-10', '数的分与合', '10 可以分成几和几', 1, (() => { const s = 10; return () => { const a = ri(1, s - 1); return q(`${s} 可以拆成 ${a} 和 ？`, s - a, { visual: { kind: 'dots', icon: pick(['🍎', '💎', '⭐']), n: s } }) } })()),
          P('pk-split-20', '20 的分与合', '20 可以分成几和几', 1, (() => { const s = 20; return () => { const a = ri(1, s - 1); return q(`${s} 可以拆成 ${a} 和 ？`, s - a, { visual: { kind: 'dots', icon: pick(['🍬', '🎈', '🍓']), n: s } }) } })()),
          P('pk-odd-1', '单数和双数', '两个两个数剩 1 是单数', 1, G.oddEven())
        ]),
        U('🕐', '生活数学', [
          P('pk-clock-1', '认识整时', '分针指 12 是整时', 1, G.clock()),
          P('pk-clock-0', '整时判断', '看看是几时', 1, G.clock()),
          P('pk-money-1', '认识钱币', '10 元可以怎么换', 1, G.money())
        ])
      ])
    ]
  },
  {
    key: 'kz', name: '成长', icon: '🎯', grades: [1, 2],
    desc: '一年级主线，10/20 以内加减打牢基础',
    levels: [
      LV('10 以内加减法', [
        U('➕', '10 以内加法', [
          P('kz-add-5', '5 以内加法', '小数目的加法起步', 1, G.add5(1, 5)),
          P('kz-add-3', '3 以内加法', '1+1、1+2', 1, G.add5(1, 4)),
          P('kz-add-10', '10 以内加法', '凑满 10 的加法', 1, G.add(10)),
          P('kz-add-610', '6-10 的加法', '大一点的加法', 1, G.add5(6, 10)),
          P('kz-add-0', '和 0 做朋友', '加 0 减 0 不变', 1, G.zeroAdd()),
          P('kz-add-swap', '加法好朋友', '交换位置结果一样', 1, G.swap())
        ]),
        U('➖', '10 以内减法', [
          P('kz-sub-10', '10 以内减法', '从 10 里去掉一些', 1, G.sub(10)),
          P('kz-sub-from9', '9 减几', '9 - 1 到 9 - 8', 1, G.subFrom(9)),
          P('kz-sub-from8', '8 减几', '8 - 1 到 8 - 7', 1, G.subFrom(8)),
          P('kz-sub-from10', '10 减几', '10 - 1 到 10 - 9', 1, G.subFrom(10)),
          P('kz-sub-inv', '加减是好朋友', '用加法想减法', 1, G.inverse()),
          P('kz-sub-0', '差是 0 的减法', '去掉全部就剩 0', 1, G.zeroAdd())
        ]),
        U('🎲', '混合与应用', [
          P('kz-mix-10', '加减混合', '加法减法随机来', 1, G.addSub(10)),
          P('kz-chain-add', '连加', '三个数连着加', 1, G.chain(20)),
          P('kz-chain-sub', '连减', '三个数连着减', 1, G.chainSub(20)),
          P('kz-missadd-10', '缺加数', '3 + ? = 7', 1, G.missAdd(10)),
          P('kz-misssub-10', '缺减数', '9 - ? = 4', 1, G.missSub(10)),
          P('kz-judge-10', '对错小法官', '判断算式对不对', 1, G.judge(10))
        ])
      ]),
      LV('20 以内加减法', [
        U('🔟', '凑十与破十', [
          P('kz-tens-9', '凑十法：9 加几', '9 + 几，先凑十', 1, L('make-ten-bridge-drag')),
          P('kz-tens-8', '凑十法：8 加几', '8 + 几，先凑十', 1, G.add5(8, 18)),
          P('kz-tens-67', '凑十法：6、7 加几', '先凑十再相加', 1, G.add5(6, 9)),
          P('kz-break-9', '破十法：十几减 9', '先破十再相加', 1, L('break-ten-subtraction-advanced')),
          P('kz-break-8', '破十法：十几减 8', '先破十再相加', 1, G.subFrom(18)),
          P('kz-flat-10', '平十减法', '先减到 10 再减', 1, L('make-ten-subtraction')),
          P('kz-tens-mix', '凑十综合', '凑十法大合集', 1, G.add(18)),
          P('kz-break-mix', '破十综合', '破十法大合集', 1, G.sub(18))
        ]),
        U('🧮', '20 以内综合', [
          P('kz-add-20', '20 以内加法', '不进位与进位都练', 1, G.add(20)),
          P('kz-sub-20', '20 以内减法', '退位减法', 1, G.sub(20)),
          P('kz-cmp-20', '20 以内比大小', '填 > < 或 =', 1, G.cmpN(20)),
          P('kz-cmp-expr2', '算式比大小', '两边算式比一比', 1, L('expression-compare-choice')),
          P('kz-missadd-20', '20 以内缺加数', '? + 5 = 13', 1, G.missAdd(20)),
          P('kz-misssub-20', '20 以内缺减数', '15 - ? = 8', 1, G.missSub(20)),
          P('kz-judge-20', '真假侦探', '20 以内对错判断', 1, L('true-or-not-k'))
        ])
      ]),
      LV('规律与应用启蒙', [
        U('🔮', '规律与排序', [
          P('kz-pattern', '寻找规律', '下一个是几', 1, G.pattern(2, 1)),
          P('kz-pattern-5', '规律：每次多 5', '跳着数数', 1, G.pattern(5, 5)),
          P('kz-pattern-3', '规律：每次多 3', '接着往下数', 1, G.pattern(3, 3)),
          P('kz-number-hunt', '寻找数字', '找出比它大的数', 1, G.hunt(30, 10)),
          P('kz-order', '数字排序', '谁最大谁最小', 1, G.ordN(10, 50)),
          P('kz-hundred-1', '认识百数表', '百数表找邻居', 1, L('hundred-chart-practice')),
          P('kz-tens-more', '多 10 少 10', '比它大 10 是多少', 1, G.tensMore()),
          P('kz-half', '一半是多少', '分一半就知道', 1, G.half()),
          P('kz-judge-10', '判断对错', '算式对不对一眼看穿', 1, G.judge(10)),
          P('kz-order-2', '四数排序', '四个数比大小', 1, G.ordN(10, 99))
        ]),
        U('📖', '看图与应用', [
          P('kz-picture', '看图列算式', '看图写出答案', 1, L('look-picture-formula')),
          P('kz-picture-2', '看图应用', '吃掉几个还剩几个', 1, L('look-picture-formula')),
          P('kz-word-1', '简单应用题', '买东西找零钱', 1, G.word()),
          P('kz-cnt-word', '连加应用', '三个数连加', 1, G.chain(20)),
          P('kz-clock-2', '认识时间', '整时与经过时间', 1, G.clock()),
          P('kz-money-2', '人民币换算', '元角分换算', 1, G.money())
        ])
      ])
    ]
  },
  {
    key: 'gb', name: '提高', icon: '🚀', grades: [1, 2, 3],
    desc: '二年级主线，100 以内加减与表内乘除',
    levels: [
      LV('100 以内加减法', [
        U('➕', '加法进阶', [
          P('gb-add-nocarry', '两位数加一位数不进位', '个位相加不满十', 2, G.noCarry()),
          P('gb-add-carry1', '两位数加一位数进位', '个位满十进一', 2, G.carry2()),
          P('gb-add-carry22', '两位数加两位数', '竖式进位加法', 2, G.carry22()),
          P('gb-add-int', '整十数加减', '30 + 50、80 - 30', 2, G.int10()),
          P('gb-add-col', '加法竖式进位', '列竖式算加法', 2, L('column-addition-carry')),
          P('gb-add-int100', '整百数加减', '400 + 300', 2, G.int100())
        ]),
        U('➖', '减法进阶', [
          P('gb-sub-noborrow', '两位数减一位数不退位', '个位够减', 2, G.noBorrow()),
          P('gb-sub-borrow1', '两位数减一位数退位', '个位不够向十位借', 2, G.borrow2()),
          P('gb-sub-borrow22', '两位数减两位数', '退位减法', 2, G.borrow22()),
          P('gb-sub-col', '减法竖式退位', '列竖式算减法', 2, L('column-subtraction-borrow')),
          P('gb-sub-miss', '加减填空', '缺数填空', 2, G.missAdd(100)),
          P('gb-sub-int100', '整百数减法', '900 - 400', 2, G.int100())
        ]),
        U('⚖️', '比较与判断', [
          P('gb-cmp-100', '100 以内比大小', '填 > < 或 =', 2, G.cmpN(100)),
          P('gb-cmpexpr', '算式比大小', '两个算式比结果', 2, L('expression-compare-choice')),
          P('gb-judge-100', '真假侦探', '100 以内对错判断', 2, G.judge(100))
        ])
      ]),
      LV('表内乘除法', [
        U('✖️', '乘法口诀', [
          P('gb-mul-2', '2 的乘法口诀', '一二得二……', 2, G.mulT(2)),
          P('gb-mul-3', '3 的乘法口诀', '一三得三……', 2, G.mulT(3)),
          P('gb-mul-4', '4 的乘法口诀', '一四得四……', 2, G.mulT(4)),
          P('gb-mul-5', '5 的乘法口诀', '一五得五……', 2, G.mulT(5)),
          P('gb-mul-6', '6 的乘法口诀', '一六得六……', 2, G.mulT(6)),
          P('gb-mul-7', '7 的乘法口诀', '一七得七……', 2, G.mulT(7)),
          P('gb-mul-8', '8 的乘法口诀', '一八得八……', 2, G.mulT(8)),
          P('gb-mul-9', '9 的乘法口诀', '一九得九……', 2, G.mulT(9)),
          P('gb-mul-choice', '乘法口诀选一选', '口诀四选一', 2, G.mulChoice()),
          P('gb-mul-mix', '口诀综合', '所有口诀混着来', 2, G.mul(9, 9)),
          P('gb-mul-factor', '因数配对', '哪两个数相乘得到它', 2, G.factor())
        ]),
        U('➗', '除法启蒙', [
          P('gb-div-mean', '平均分', '平均分给几个人', 2, G.average()),
          P('gb-div-table', '表内除法', '用口诀算除法', 2, G.div(9, 9)),
          P('gb-div-choice', '除法选一选', '商是多少', 2, G.divChoice()),
          P('gb-div-col', '除法竖式基础', '列竖式算除法', 2, L('column-division-one-digit-input')),
          P('gb-div-rem', '有余数除法', '商和余数', 2, G.divRem()),
          P('gb-div-rem-app', '有余数应用', '最多装满几袋', 2, G.divRemApp())
        ]),
        U('🧩', '乘加乘减', [
          P('gb-muladd', '乘加乘减', '先乘后加减', 2, G.mulAddSub()),
          P('gb-pic-mul', '看图列乘法', '几个几相加', 2, L('picture-multiplication-formula')),
          P('gb-skip', '拆分求积', '按倍数跳着数', 2, L('skip-count-multiply'))
        ])
      ]),
      LV('生活与应用', [
        U('📏', '测量与单位', [
          P('gb-ruler', '长度测量', '看尺子读长度', 2, G.ruler()),
          P('gb-unit-mcm', '米与厘米', '1 米 = 100 厘米', 2, G.unit([['米', '厘米', 100, 1, 9]])),
          P('gb-order-len', '长度比拼', '谁最长谁最短', 2, L('order-by-length')),
          P('gb-unit-time', '时与分', '1 时 = 60 分', 2, G.unit([['时', '分', 60, 1, 12]])),
          P('gb-money-buy', '钱币计算', '买东西找零', 2, G.moneyBuy()),
          P('gb-unit-yuanjiao', '元角分换算', '1 元 = 10 角', 2, G.money())
        ]),
        U('🛤️', '数轴与百数表', [
          P('gb-line-add', '数轴加法', '往右跳几格', 2, L('teen-plus-number')),
          P('gb-line-sub', '数轴减法', '往左跳几格', 2, L('number-line-subtraction')),
          P('gb-hundred-2', '百数表进阶', '上下左右的规律', 2, L('hundred-chart-advanced')),
          P('gb-place-build', '位值搭建', '按位值搭数字', 2, L('place-value-builder')),
          P('gb-place-cmp', '比较数字', '位值比较', 2, L('compare-number-symbols'))
        ]),
        U('🔮', '规律进阶', [
          P('gb-pattern-2', '找规律：等差', '每次多几', 2, G.pattern(3, 5)),
          P('gb-pattern-10', '规律：每次多 10', '整十跳数', 2, G.pattern(10, 10)),
          P('gb-odd', '奇偶数判断', '单数还是双数', 2, G.oddEven()),
          P('gb-seq', '数的规律排序', '按规律接着排', 2, L('number-sequence-missing-choice'))
        ])
      ])
    ]
  },
  {
    key: 'jj', name: '进阶', icon: '✈️', grades: [2, 3, 4],
    desc: '三年级主线，万以内运算、竖式与图形',
    levels: [
      LV('万以内加减法', [
        U('🧮', '三位数加减', [
          P('jj-add-3', '三位数加法', '几百几十加几百几十', 3, G.add3()),
          P('jj-add-int10', '整十数加减', '120 + 30', 3, G.int10()),
          P('jj-sub-3', '三位数减法', '几百几十减几百几十', 3, G.sub3()),
          P('jj-carry-3', '三位数进位加法', '个位十位都进位', 3, G.carry3()),
          P('jj-borrow-3', '三位数退位减法', '不够减就借位', 3, G.borrow3()),
          P('jj-cont-borrow', '连续退位减法', '连着借位', 3, G.contBorrow()),
          P('jj-int-100', '整百数加减', '400 + 300', 3, G.int100()),
          P('jj-est', '估算', '先取整再估', 3, G.estimate()),
          P('jj-est-add', '加法估算', '两个数大约是多少', 3, G.estimate()),
          P('jj-cmp-100', '百以内比大小', '复习比大小', 3, G.cmpN(100))
        ]),
        U('⚖️', '比较与验算', [
          P('jj-cmp-1000', '千以内比大小', '大数比一比', 3, G.cmpN(1000)),
          P('jj-missadd-1000', '加法填空', '缺哪个数', 3, G.missAdd(1000)),
          P('jj-judge-1000', '真假侦探', '万以内判断', 3, G.judge(1000))
        ])
      ]),
      LV('乘除法竖式', [
        U('✖️', '多位数乘法', [
          P('jj-mulcol-no', '乘法竖式不进位', '每位相乘不进位', 3, G.mulColNo()),
          P('jj-mulcol-carry', '乘法竖式进位', '两位数乘一位数', 3, G.mulColCarry()),
          P('jj-mul-2d', '两位数乘一位数', '口算与竖式', 3, G.mul(99, 9)),
          P('jj-mul-big', '多位数乘法', '三位数乘一位数', 3, G.mul(999, 9)),
          P('jj-mul-int10', '整十数乘一位数', '30 × 4', 3, G.mulInt10())
        ]),
        U('➗', '多位数除法', [
          P('jj-div-2', '除法竖式进阶', '商是两位数', 3, G.colDiv(true)),
          P('jj-div-1', '除法竖式基础', '商是一位数', 3, G.colDiv(false)),
          P('jj-div-rem2', '有余数除法进阶', '商大余数也要算', 3, G.divRem()),
          P('jj-div-rem-app', '有余数应用', '最多装满几袋', 3, G.divRemApp()),
          P('jj-div-est', '除法估算', '商大约是多少', 3, G.div(9, 20))
        ]),
        U('🧩', '混合运算', [
          P('jj-mix-4', '四则混合', '先乘除后加减', 3, G.mix4()),
          P('jj-bracket', '带括号运算', '括号里先算', 3, G.bracket()),
          P('jj-bracket-sub', '括号减法', 'a - (b + c)', 3, G.bracketSub()),
          P('jj-operator', '补运算符', '填上 + - × ÷', 3, L('operator-symbol-fill')),
          P('jj-balance', '等式平衡', '两边相等填空缺', 3, L('balance-equation'))
        ])
      ]),
      LV('图形与计量', [
        U('📐', '周长与图形', [
          P('jj-peri', '长方形周长', '(长 + 宽) × 2', 3, G.perimeter()),
          P('jj-peri-sq', '正方形周长', '边长 × 4', 3, G.periSq()),
          P('jj-peri-build', '矩形建造师', '围出周长', 3, L('build-perimeter-rectangle')),
          P('jj-shape-attr', '数边数角', '图形特征', 3, G.shapeCount()),
          P('jj-3d', '3D 小专家', '立体图形数一数', 3, G.threeD()),
          P('jj-grid', '藏宝图', '用数对找位置', 3, L('grid-direction-locate'))
        ]),
        U('🍕', '分数初步', [
          P('jj-frac-mean', '几分之一', '平均分的每一份', 3, G.fracMean()),
          P('jj-frac-half', '几分之几', '涂色部分占多少', 3, G.fracUnit(6)),
          P('jj-frac-add', '同分母加法', '分母不变分子加', 3, G.fracUnit(6)),
          P('jj-frac-cmp', '分数比大小', '谁大谁小', 3, G.fracCmp()),
          P('jj-cut', '切切乐', '平均分成几块', 3, L('halves-fourths'))
        ]),
        U('📏', '质量与时间', [
          P('jj-mass', '千克与克', '1 千克 = 1000 克', 3, G.mass()),
          P('jj-mass-2', '吨与千克', '1 吨 = 1000 千克', 3, G.mass()),
          P('jj-time-unit', '时与分换算', '1 时 = 60 分', 3, G.unit([['时', '分', 60, 1, 12]])),
          P('jj-clock-min', '认识几分', '几时几分', 3, G.clockMin()),
          P('jj-time-add', '时间计算', '几时过几小时', 3, G.clock()),
          P('jj-mul-2x2', '两位数乘两位数', '竖式分步乘', 3, G.mul(99, 99)),
          P('jj-year', '年月日', '大月小月和闰年', 3, G.yearQ()),
          P('jj-km', '千米与米', '1 千米 = 1000 米', 3, G.kmUnit())
        ])
      ])
    ]
  },
  {
    key: 'ky', name: '跨越', icon: '💡', grades: [3, 4, 5],
    desc: '四年级主线，大数、小数初步与统计',
    levels: [
      LV('大数与位值', [
        U('🔢', '亿以内数的认识', [
          P('ky-bignum', '亿以内数的组成', '万级个级一起来', 4, G.bigNum()),
          P('ky-bigread', '大数的最高位', '读大数先看位', 4, G.bigRead()),
          P('ky-bigread-2', '大数读几级', '万级个级分开读', 4, G.bigRead()),
          P('ky-place', '位值原理', '每个数字代表多少', 4, G.digitVal()),
          P('ky-place-read', '看位值选数字', '按条件选数', 4, L('place-value-read-choice')),
          P('ky-place-judge', '数位判断', '这个数字在哪一位', 4, L('place-value-adjust')),
          P('ky-expand', '展开式', '数位展开填一填', 4, G.expand())
        ]),
        U('🎯', '取整与估算', [
          P('ky-round-10', '四舍五入到十位', '取整小能手', 4, G.roundN()),
          P('ky-round-100', '四舍五入到百位', '更大数的取整', 4, G.round100()),
          P('ky-round-1000', '四舍五入到千位', '万以内取整', 4, G.round1000()),
          P('ky-est', '估算进阶', '大数估算', 4, G.estimate()),
          P('ky-cmp-big', '大数比大小', '位数多的更大', 4, G.cmpN(100000))
        ])
      ]),
      LV('小数初步', [
        U('🔸', '小数的意义', [
          P('ky-dec-read', '数的读写', '小数怎么读', 4, G.decRead()),
          P('ky-dec-money', '小数与钱币', '几元几角写成小数', 4, G.dec(1, 10)),
          P('ky-dec-cmp', '小数比大小', '先比整数部分', 4, G.decCmp()),
          P('ky-dec-mean', '小数的组成', '一位小数的含义', 4, G.dec(1, 10)),
          P('ky-dec-mean2', '两位小数的含义', '百分位的含义', 4, G.dec(2, 100))
        ]),
        U('🧮', '小数加减', [
          P('ky-dec-add1', '小数加法不进位', '小数点对齐', 4, G.dec(1, 10)),
          P('ky-dec-add2', '小数加法进位', '满十进一', 4, G.dec(1, 10)),
          P('ky-dec-add3', '两位小数加法', '百分位对齐', 4, G.dec(2, 100)),
          P('ky-dec-sub1', '小数减法退位', '不够减借一', 4, G.dec(1, 10)),
          P('ky-dec-sub2', '两位小数减法', '百分位借位', 4, G.dec(2, 100)),
          P('ky-dec-col', '小数竖式', '列竖式算小数', 4, L('decimal-column-carry-addition'))
        ])
      ]),
      LV('图形与统计', [
        U('📐', '角与图形', [
          P('ky-angle', '认角高手', '锐角直角钝角', 4, G.angle()),
          P('ky-angle-2', '角的大小', '度数越大角越大', 4, G.angle()),
          P('ky-shape-attr', '图形特征', '边和角数一数', 4, G.shapeCount()),
          P('ky-3d', '立体图形', '正方体有几个面', 4, G.threeD()),
          P('ky-3d-count', '立体图形计数', '棱和顶点数一数', 4, G.threeD()),
          P('ky-peri', '周长复习', '长方形周长', 4, G.perimeter()),
          P('ky-peri-rect', '周长进阶', '正方形周长', 4, G.periSq()),
          P('ky-tri-type', '三角形分类', '锐角直角钝角三角形', 4, G.triType()),
          P('ky-tri-sum', '三角形内角和', '三个角和是 180°', 4, G.triSum()),
          P('ky-obs', '观察物体', '从不同方向看图形', 4, G.obsJudge()),
          P('ky-mul-big', '三位数乘两位数', '竖式大数乘', 4, G.mul(999, 99)),
          P('ky-div-big', '多位数除法', '除数两位也难不倒', 4, G.colDiv(true)),
          P('ky-area-unit', '面积单位换算', '平方米和平方分米', 4, G.areaUnit())
        ]),
        U('📊', '统计与平均', [
          P('ky-bar', '图表会说话', '读统计图比多少', 4, G.barGraph()),
          P('ky-bar-2', '统计图进阶', '多比几组', 4, G.barGraph()),
          P('ky-avg', '平均数', '总数 ÷ 人数', 4, G.average()),
          P('ky-avg-2', '平均分配', '判断分得对不对', 4, L('average-share-judge-choice')),
          P('ky-substitute', '代换推理', '用已知推未知', 4, G.substitute()),
          P('ky-picture-eq', '图文推算', '看图推出答案', 4, G.picture())
        ])
      ])
    ]
  },
  {
    key: 'py', name: '培优', icon: '🔥', grades: [4, 5, 6],
    desc: '五年级主线，小数乘除与分数体系',
    levels: [
      LV('小数运算', [
        U('✖️', '小数乘法', [
          P('py-dec-mul', '小数乘整数', '先按整数乘', 5, G.decMulInt()),
          P('py-dec-mul2', '小数乘法进位', '积要点对小数点', 5, L('decimal-column-carry-multiplication')),
          P('py-dec-mul2d', '两位小数乘法', '百分位也要对齐', 5, G.decMulInt2()),
          P('py-dec-add', '小数加减混合', '小数点对齐加减', 5, G.dec(1, 100)),
          P('py-dec-add1', '一位小数加法', '热身练习', 5, G.dec(1, 10)),
          P('py-dec-sub1', '一位小数减法', '热身练习', 5, G.dec(1, 10)),
          P('py-dec-cmp', '小数比大小', '多位小数比较', 5, G.decCmp())
        ]),
        U('➗', '小数除法', [
          P('py-dec-div', '小数除以整数', '商是小数', 5, G.decDivInt()),
          P('py-dec-div2', '小数除法进阶', '商要保留位数', 5, L('decimal-column-division')),
          P('py-dec-div2d', '两位小数除法', '商是两位小数', 5, G.decDivInt2()),
          P('py-dec-mix', '小数四则混合', '先乘除后加减', 5, G.dec(1, 100))
        ])
      ]),
      LV('分数体系', [
        U('🍕', '分数的意义', [
          P('py-frac-mean', '分数的意义', '涂色部分占几分之几', 5, G.fracMean()),
          P('py-frac-cmp', '比较分数', '同分母同分子比较', 5, G.fracCmp()),
          P('py-frac-cmp2', '分数比大小进阶', '通分比较', 5, G.fracCmp()),
          P('py-frac-common', '分数通分', '变成同分母', 5, G.fracCommon()),
          P('py-frac-common2', '通分进阶', '找公倍数', 5, G.fracCommon()),
          P('py-dec-frac', '小数分数比大小', '互相比一比', 5, L('decimal-expression-compare-choice'))
        ]),
        U('🧮', '分数加减', [
          P('py-frac-add-same', '同分母加减', '分母不变分子加减', 5, G.fracUnit(8)),
          P('py-frac-add-same2', '同分母加减进阶', '结果要约分', 5, G.fracUnit(12)),
          P('py-frac-sub-same', '同分母减法', '分子相减', 5, G.fracUnit(9)),
          P('py-frac-add-mix', '异分母加减', '先通分再加减', 5, G.fracMixed(2)),
          P('py-frac-mixed', '分数加减混合', '加减都来一点', 5, G.fracMixed(1))
        ])
      ]),
      LV('图形与应用', [
        U('📐', '面积与图形', [
          P('py-area', '长方形面积', '长 × 宽', 5, G.area()),
          P('py-area-peri', '周长与面积', '两个都要会算', 5, G.perimeter()),
          P('py-frac-shape', '图形分数', '分数表示涂色部分', 5, L('fraction-of-shape-choice')),
          P('py-tri-sum', '三角形内角和', '三个角加起来 180°', 5, G.triSum()),
          P('py-cube-count', '搭正方体', '要几个小方块', 5, G.cubeCount())
        ]),
        U('🧠', '代数启蒙', [
          P('py-eq', '方程初步', 'x 加几等于几', 5, G.equation()),
          P('py-eq-2', '方程进阶', 'x 在减数位置', 5, G.equation()),
          P('py-balance', '等式平衡', '天平两边相等', 5, L('balance-builder')),
          P('py-word-speed', '行程问题', '速度 × 时间 = 路程', 5, G.wordSpeed()),
          P('py-word-money', '购物问题', '单价 × 数量', 5, G.moneyBuy()),
          P('py-array', '数阵图', '每条线的和相等', 5, G.arrayLogic()),
          P('py-substitute', '代换推理', '用已知推未知', 5, G.substitute()),
          P('py-pattern-mul', '找规律：倍数', '每次乘几', 5, G.patternMul())
        ]),
        U('🎈', '趣味应用', [
          P('py-word-plant', '植树问题', '两端都种要加一', 5, G.plant()),
          P('py-word-age', '年龄问题', '年龄差不变', 5, G.age()),
          P('py-word-chicken', '鸡兔同笼', '假设法慢慢来', 5, G.chicken()),
          P('py-frac-word', '分数应用题', '求一个数的几分之几', 5, G.fracWord()),
          P('py-mul-big', '三位数乘两位数', '大数竖式乘', 5, G.mul(999, 99)),
          P('py-div-big', '大数除法', '除数是两位数', 5, G.colDiv(true))
        ])
      ])
    ]
  },
  {
    key: 'jy', name: '精英', icon: '🌟', grades: [5, 6],
    desc: '六年级主线，分数四则、比与百分数、综合推理',
    levels: [
      LV('分数四则运算', [
        U('🍕', '分数乘除法', [
          P('jy-frac-mul', '分数乘整数', '分子乘整数', 6, G.fracMulDiv(false)),
          P('jy-frac-mul2', '分数乘分数', '分子乘分子分母乘分母', 6, G.fracMulDiv(false)),
          P('jy-frac-div', '分数除法', '除以一个数等于乘倒数', 6, G.fracMulDiv(true)),
          P('jy-frac-mix', '分数混合运算', '加减乘除混合', 6, G.fracMixed(1)),
          P('jy-frac-mix2', '异分母混合', '通分后再算', 6, G.fracMixed(2))
        ]),
        U('⚖️', '负数启蒙', [
          P('jy-neg', '负数减法', '小减大得负数', 6, G.negative()),
          P('jy-neg-cmp', '正负数比大小', '负数比正数小', 6, G.cmpN(20)),
          P('jy-neg-add', '负数加法', '负数加正数慢慢算', 6, G.negAdd()),
          P('jy-neg-mul', '负数乘法', '同号得正异号得负', 6, G.negMul())
        ])
      ]),
      LV('比与百分数', [
        U('🧮', '比的认识', [
          P('jy-ratio', '比的化简', '同时除以公因数', 6, G.ratio()),
          P('jy-percent', '百分数化小数', '去掉 % 小数点左移', 6, G.percent()),
          P('jy-percent-mul', '百分数应用', '求一个数的百分之几', 6, G.discount()),
          P('jy-percent-div', '倒推求整体', '已知部分求整体', 6, G.percentDiv())
        ]),
        U('🛒', '生活应用', [
          P('jy-discount', '折扣问题', '打几折就是十分之几', 6, G.discount()),
          P('jy-interest', '利息问题', '本金 × 利率 × 时间', 6, G.interest()),
          P('jy-ratio-app', '按比例分配', '按几比几分东西', 6, G.ratioApp()),
          P('jy-word-speed', '行程综合', '速度时间路程', 6, G.wordSpeed()),
          P('jy-word-buy', '购物综合', '单价数量总价', 6, G.moneyBuy())
        ])
      ]),
      LV('圆与综合推理', [
        U('⭕', '圆的启蒙', [
          P('jy-circle-d', '圆的半径与直径', '直径是半径的 2 倍', 6, G.circle()),
          P('jy-circle-c', '圆的周长感', '圆一周的长度', 6, G.circle()),
          P('jy-circle-area', '圆的面积', 'πr²，π 取 3.14', 6, G.circleArea()),
          P('jy-circle-peri', '圆的周长计算', 'C = 2πr', 6, G.circlePeri())
        ]),
        U('📦', '立体图形', [
          P('jy-solid-name', '立体图形认一认', '圆柱球锥都认识', 6, G.solidName()),
          P('jy-cube-vol', '正方体体积', '棱长 × 棱长 × 棱长', 6, G.cubeVol()),
          P('jy-cube-count', '搭大正方体', '要几个小方块', 6, G.cubeCount())
        ]),
        U('🔮', '逻辑推理', [
          P('jy-substitute', '代换关系推理', '图形代换', 6, G.substitute()),
          P('jy-picture', '图文推算', '看图推出每个是多少', 6, G.picture()),
          P('jy-array', '数阵图', '和相等填空缺', 6, G.arrayLogic()),
          P('jy-pattern-mul', '找规律：倍数', '每次乘几', 6, G.patternMul()),
          P('jy-grid', '藏宝图', '数对表示位置', 6, L('grid-direction-locate')),
          P('jy-frac-cmp', '分数比大小', '通分或交叉相乘', 6, G.fracCmp()),
          P('jy-cmpexpr', '算式比大小', '综合比较', 6, L('expression-compare-choice')),
          P('jy-prop', '正比例判断', '比值一定成正比例', 6, G.propJudge())
        ])
      ])
    ]
  }
]

/* ---------------- 汇总与查询 ---------------- */
export const STAGE_POINTS = STAGES.flatMap((s) =>
  s.levels.flatMap((lv) =>
    lv.units.flatMap((u) =>
      u.points.map((p) => Object.assign({}, p, { stage: s.key, stageName: s.name, stageIcon: s.icon, unit: u.title, unitEmoji: u.emoji, level: lv.title }))
    )
  )
)

// 采样一次得到每个知识点的默认交互类型
for (const p of STAGE_POINTS) {
  try {
    p.t = p.gen().type || 'input'
  } catch (e) {
    p.t = 'input'
  }
}

export function stagePoint(key) {
  return STAGE_POINTS.find((p) => p.key === key)
}
export function stagePointName(key) {
  const p = stagePoint(key)
  return p ? p.title : '知识点练习'
}
// 一个知识点生成一组题（趣味互动 5 题 / 智能测验 8 题）
// fun=true 时低段知识点混入「算式配对」互动题（乐喵同款玩法）
export function stagePointGenerate(key, count, fun) {
  const p = stagePoint(key)
  if (!p) return []
  const list = []
  const seen = new Set()
  const matchMax = { 7: 10, 1: 10, 2: 20, 3: 50 }
  const useMatch = fun && matchMax[p.g]
  let guard = 0
  while (list.length < count && guard < count * 60) {
    guard++
    let qq
    if (useMatch && list.length % 2 === 0) {
      qq = G.matchQuestion(useMatch, Math.min(4 + Math.floor(list.length / 2), 6))()
      if (qq.type === 'match') {
        const sig = 'match' + qq.pairs.map((x) => x.l).join(',')
        if (guard < count * 40 && seen.has(sig)) continue
        seen.add(sig)
      }
    } else {
      qq = p.gen()
      const sig = qq.text + '|' + qq.answer
      if (guard < count * 40 && seen.has(sig)) continue
      seen.add(sig)
    }
    list.push(Object.assign({ id: list.length + 1, mode: 'P_' + key }, qq))
  }
  return list
}
// 板块可见知识点数（按年级过滤）
export function stagePointCount(stage, grade) {
  let n = 0
  for (const lv of stage.levels) {
    for (const u of lv.units) {
      for (const p of u.points) {
        if (!grade || grade === 7 || !p.g || p.g === grade) n++
      }
    }
  }
  return n
}
// 全部知识点总数
export const TOTAL_POINTS = STAGE_POINTS.length
