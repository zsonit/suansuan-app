// 乐喵口算题卡全量移植：7 大分组 · 105 张答题卡片
// 数据来源：对乐喵口算 APK（assets app-service.js）题型结构化提取
// 交互映射到算算星球四种题型：input 数字键盘 / compare 选><= / judge 判对错 / choice 四选一

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
// 数值四选一：正确答案 + 典型错误项
function numOptions(ans, deltas) {
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
// 文本四选一
function textOptions(ans, wrongs) {
  return shuffle([ans, ...wrongs.slice(0, 3)])
}
function q(text, answer, extra) {
  return Object.assign({ text, answer }, extra || {})
}

// ---------- 通用生成器 ----------
function genFacts(max) {
  const isAdd = Math.random() < 0.5
  if (isAdd) {
    const a = ri(1, max - 1)
    const b = ri(1, max - a)
    return q(`${a} + ${b}`, a + b)
  }
  const a = ri(2, max)
  const b = ri(1, a)
  return q(`${a} - ${b}`, a - b)
}
function genCarryAdd(range) {
  let a, b
  do {
    a = ri(range[0], range[1])
    b = ri(range[2], range[3])
  } while ((a % 10) + (b % 10) < 10)
  return q(`${a} + ${b}`, a + b)
}
function genNoCarryAdd(range) {
  let a, b
  do {
    a = ri(range[0], range[1])
    b = ri(range[2], range[3])
  } while ((a % 10) + (b % 10) >= 10)
  return q(`${a} + ${b}`, a + b)
}
function genBorrowSub(range) {
  let a, b
  do {
    a = ri(range[0], range[1])
    b = ri(range[2], range[3])
  } while (a % 10 >= b % 10 || a - b < 1)
  return q(`${a} - ${b}`, a - b)
}
function genNoBorrowSub(range) {
  let a, b
  do {
    a = ri(range[0], range[1])
    b = ri(range[2], range[3])
  } while (a % 10 < b % 10)
  return q(`${a} - ${b}`, a - b)
}
function genMul(maxA, maxB) {
  const a = ri(2, maxA)
  const b = ri(2, maxB)
  return q(`${a} × ${b}`, a * b)
}
function genDiv(maxB, maxQ) {
  const b = ri(2, maxB)
  const qt = ri(2, maxQ)
  return q(`${b * qt} ÷ ${b}`, qt)
}
function genDecAdd(dot, places) {
  const d = places
  const isAdd = Math.random() < 0.5
  if (isAdd) {
    const a = ri(1, 499) / d
    const b = ri(1, 499) / d
    return q(`${a.toFixed(dot)} + ${b.toFixed(dot)}`, Number((a + b).toFixed(dot + 1)), { dot: true })
  }
  const a = ri(20, 999) / d
  const b = ri(1, a - 0.1)
  return q(`${a.toFixed(dot)} - ${b.toFixed(dot)}`, Number((a - b).toFixed(dot + 1)), { dot: true })
}
function genFracOp() {
  const d = ri(2, 9)
  let a = ri(1, d - 1)
  let b = ri(1, d - 1)
  if (Math.random() < 0.4) {
    if (b > a) { const t = a; a = b; b = t }
    return { text: `${a}/${d} - ${b}/${d}`, answer: fracStr(a - b, d), type: 'frac' }
  }
  b = ri(1, d - a)
  return { text: `${a}/${d} + ${b}/${d}`, answer: fracStr(a + b, d), type: 'frac' }
}
function genCmpNum(max) {
  let a = ri(0, max)
  let b = ri(0, max)
  if (Math.random() < 0.15) b = a
  return q(`${a} ○ ${b}`, symOf(a - b), { type: 'compare' })
}
function genJudgeEq(max) {
  const isAdd = Math.random() < 0.5
  let val, l, r
  if (isAdd) {
    l = ri(1, max - 1)
    r = ri(1, max - l)
    val = l + r
  } else {
    l = ri(2, max)
    r = ri(1, l)
    val = l - r
  }
  const ok = Math.random() < 0.5
  let shown = val
  if (!ok) {
    shown = Math.max(0, val + pick([-3, -2, -1, 1, 2, 3]))
    if (shown === val) shown = val + 2
  }
  return q(`${l} ${isAdd ? '+' : '-'} ${r} = ${shown}`, ok ? '√' : '×', { type: 'judge' })
}

// ===================================================================
export const LEMIAO_GROUPS = [
  {
    key: 'number-sense',
    name: '数感与认数',
    desc: '练习认数、数量对应、数序、位值和数字表示等基础数感内容',
    acts: [
      { key: 'snack-counting', name: '零食认数', icon: '🍬', desc: '数一数零食有几个', grades: [1], gen: () => { const n = ri(3, 9); return q('🍬'.repeat(n) + ' 共几个？', n) } },
      { key: 'bath-toy-count', name: '玩具数数看', icon: '🛁', desc: '两个区里的玩具加起来', grades: [1], gen: () => { const a = ri(1, 5); const b = ri(1, 5); return q(`${'🐠'.repeat(a)} + ${'🐟'.repeat(b)} 共几条？`, a + b) } },
      { key: 'multi-representation-number-match', name: '数字图片配对', icon: '🔢', desc: '选出正确的数的组成', grades: [1, 2], gen: () => { const n = ri(11, 99); const t = Math.floor(n / 10); const o = n % 10; return q(`哪个表示 ${n}？`, `${t} 个十和 ${o} 个一`, { type: 'choice', options: textOptions(`${t} 个十和 ${o} 个一`, [`${t} 个十和 ${((o + 2) % 10 + 10) % 10} 个一`, `${o} 个十和 ${t} 个一`, `${t + 1} 个十和 ${o} 个一`]) }) } },
      { key: 'ten-frame-quantity-match', name: '数字配对', icon: '🟦', desc: '十格框里的数', grades: [1], gen: () => { const a = ri(3, 9); return q(`十格框里再放几颗刚好满，一共几颗？`, 10, { type: 'choice', options: numOptions(10, [1, 2, -1]), visual: { kind: 'tenframe', filled: a, icon: '💎' } }) } },
      { key: 'hundred-chart-practice', name: '认识百数表', icon: '💯', desc: '百数表找邻居', grades: [1, 2], gen: () => { const n = ri(11, 89); return q(`百数表中 ${n} 右边一格是几？`, n + 1) } },
      { key: 'hundred-chart-advanced', name: '百数表进阶', icon: '🧭', desc: '上下左右的规律', grades: [2], gen: () => { const n = ri(21, 68); return q(`百数表中 ${n} 下面一格是几？`, n + 10) } },
      { key: 'number-hunt', name: '寻找数字', icon: '🔎', desc: '按要求找出那个数', grades: [1, 2], gen: () => { const base = ri(30, 80); const opts = [base, base + ri(1, 9), base - ri(1, 9), base + ri(10, 19)]; return q(`找出比 ${base} 大的数`, String(Math.max(...opts)), { type: 'choice', options: shuffle(opts.map(String)) }) } },
      { key: 'number-order-sequence', name: '数字排序', icon: '📊', desc: '谁最大谁最小', grades: [1, 2], gen: () => { const s = shuffle([ri(10, 40), ri(41, 70), ri(71, 99), ri(10, 99)]); const wantMax = Math.random() < 0.5; const ans = wantMax ? Math.max(...s) : Math.min(...s); return q(`${s.join('、')} 中${wantMax ? '最大' : '最小'}的是？`, ans, { type: 'choice', options: numOptions(ans, [1, 2, 10, -1, -2]) }) } },
      { key: 'number-line-more-less-drag', name: '滑动找数', icon: '🎚️', desc: '在数轴上找到那个数', grades: [1, 2], gen: () => { const lo = ri(20, 60); const ans = lo + ri(3, 7); return q(`哪个数在 ${lo} 和 ${lo + 10} 之间？`, ans, { type: 'choice', options: shuffle([String(ans), String(lo - 2), String(lo + 12), String(lo)]) }) } },
      { key: 'decimal-read-write-choice', name: '数的读写', icon: '🗣️', desc: '小数怎么读怎么写', grades: [4, 5], gen: () => { const n = pick([0.35, 2.6, 0.08, 4.05, 12.7]); const map = { 0.35: '零点三五', 2.6: '二点六', 0.08: '零点零八', 4.05: '四点零五', 12.7: '十二点七' }; const wrongs = Object.values(map).filter((x) => x !== map[n]); return q(`${n} 读作？`, map[n], { type: 'choice', options: textOptions(map[n], wrongs) }) } },
      { key: 'expanded-form-choice', name: '展开式练习', icon: '🧩', desc: '数位展开填一填', grades: [2, 3], gen: () => { const h = ri(1, 9); const t = ri(1, 9); const o = ri(1, 9); const n = h * 100 + t * 10 + o; const part = pick(['t', 'o']); if (part === 't') return q(`${n} = ${h * 100} + ? + ${o}`, t * 10); return q(`${n} = ${h * 100} + ${t * 10} + ?`, o) } },
      { key: 'digit-value-choice', name: '数值侦探', icon: '🕵️', desc: '这个数字代表多少', grades: [2, 3], gen: () => { const h = ri(1, 9); const t = ri(1, 9); const o = ri(1, 9); const n = h * 100 + t * 10 + o; const pos = pick(['h', 't', 'o']); const dig = pos === 'h' ? h : pos === 't' ? t : o; const val = pos === 'h' ? dig * 100 : pos === 't' ? dig * 10 : dig; return q(`${n} 中的 ${dig} 表示多少？`, val, { type: 'choice', options: numOptions(val, [val === dig ? 100 : dig, 10, 1]) }) } },
      { key: 'place-value-builder', name: '位值搭建', icon: '🏗️', desc: '按位值搭出数字', grades: [2, 3], gen: () => { const h = ri(1, 9); const t = ri(1, 9); const o = ri(1, 9); return q(`${h} 个百、${t} 个十、${o} 个一组成？`, h * 100 + t * 10 + o) } },
      { key: 'place-value-read-choice', name: '看位值选数字', icon: '👀', desc: '按条件选数', grades: [2, 3], gen: () => { const h = ri(1, 9); const t = ri(1, 9); const o = ri(1, 9); const n = h * 100 + t * 10 + o; return q(`百位是 ${h}、十位是 ${t}、个位是 ${o} 的数是？`, n, { type: 'choice', options: numOptions(n, [10, 100, 1]) }) } },
      { key: 'place-value-adjust', name: '数位判断', icon: '🧐', desc: '这个数字站在哪一位', grades: [2, 3], gen: () => { const h = ri(1, 9); const t = ri(1, 9); const o = ri(1, 9); const n = h * 100 + t * 10 + o; const ok = Math.random() < 0.5; const pos = ok ? pick([['十位', t], ['百位', h], ['个位', o]]) : pick([['十位', o], ['百位', t], ['个位', h], ['百位', o]]); return q(`在 ${n} 中，${pos[1]} 在${pos[0]}上`, ok ? '√' : '×', { type: 'judge' }) } },
      { key: 'number-tracing', name: '临摹数字', icon: '✍️', desc: '照样子接着写数', grades: [1], gen: () => { const s = ri(11, 40); return q(`照样子接着写：${s}、${s + 1}、${s + 2}、？`, s + 3) } }
    ]
  },
  {
    key: 'number-composition',
    name: '数的组成与拆分',
    desc: '练习数的组成、拆分、补全和凑十等基础关系',
    acts: [
      { key: 'k-dice-add', name: '数的组成', icon: '🎲', desc: '两个点数合成一个数', grades: [1], gen: () => { const a = ri(2, 6); const b = ri(2, 6); return q(`两个骰子合起来是几？`, a + b, { visual: { kind: 'dice', a, b } }) } },
      { key: 'number-bond-missing-part', name: '数的组成', icon: '❓', desc: '缺的那部分是几', grades: [1], gen: () => { const s = ri(5, 10); const a = ri(1, s - 1); return q(`${a} + ? = ${s}`, s - a, { visual: { kind: 'dots', icon: pick(['🍎', '⭐', '🧸']), n: s, group: a } }) } },
      { key: 'number-split-drag', name: '认识拆分', icon: '✂️', desc: '把数拆成两部分', grades: [1], gen: () => { const s = ri(6, 10); const a = ri(1, s - 1); return q(`${s} 可以拆成 ${a} 和 ？`, s - a, { visual: { kind: 'bond', total: s, part: a } }) } },
      { key: 'combine-ten', name: '卡片凑数', icon: '🃏', desc: '两张卡片凑成十', grades: [1], gen: () => { const a = ri(3, 9); return q(`凑成 10：${a} + ？`, 10 - a, { type: 'choice', options: numOptions(10 - a, [1, 2, -1]) }) } },
      { key: 'ten-frame-builder', name: '十格框摆宝石', icon: '💎', desc: '再摆几颗刚好满十', grades: [1], gen: () => { const a = ri(3, 9); return q(`十格框里再摆几颗刚好满十？`, 10 - a, { visual: { kind: 'tenframe', filled: a, icon: '💎' } }) } },
      { key: 'make-ten-bridge-drag', name: '凑十法', icon: '🌉', desc: '拆小数、先凑十', grades: [1, 2], gen: () => { const a = ri(6, 9); const b = ri(11 - a, 9); return q(`${a} + ${b}：把 ${b} 拆成 ${10 - a} 和 ？，先凑十`, b - (10 - a)) } },
      { key: 'make-ten-subtraction', name: '平十减法', icon: '🪜', desc: '先减到十再减', grades: [1, 2], gen: () => { const a = ri(11, 18); const b = ri(a - 9, a - 2); return q(`${a} - ${b}：先算 ${a} - ${a - 10} = 10，再算 10 - ？`, 10 - (b - (a - 10))) } },
      { key: 'break-ten-subtraction-advanced', name: '破十法', icon: '💥', desc: '先破十、再相加', grades: [1, 2], gen: () => { const a = ri(11, 18); const b = ri(Math.max(a - 9, 2), a - 2); const ans = a - b; return q(`${a} - ${b}：先算 10 - ${b} = ${10 - b}，再算 ${10 - b} + ？`, ans - (10 - b)) } },
      { key: 'continuous-addition-step', name: '连加计算', icon: '➕', desc: '三个数依次相加', grades: [1, 2, 3], gen: () => { const m = 30; const a = ri(2, Math.floor(m / 3)); const b = ri(2, Math.floor(m / 3)); const c = ri(1, m - a - b); return q(`${a} + ${b} + ${c}`, a + b + c) } },
      { key: 'continuous-subtraction-step', name: '连减计算', icon: '➖', desc: '三个数依次相减', grades: [1, 2, 3], gen: () => { const a = ri(30, 60); const b = ri(5, 20); const c = ri(1, a - b - 1); return q(`${a} - ${b} - ${c}`, a - b - c) } },
      { key: 'related-facts', name: '关联算式', icon: '🔗', desc: '加减法是一家人', grades: [1, 2], gen: () => { const a = ri(2, 9); const b = ri(2, 9); const s = a + b; return q(`因为 ${a} + ${b} = ${s}，所以 ${s} - ？ = ${a}`, b, { type: 'choice', options: numOptions(b, [1, 2, -1]) }) } },
      { key: 'tens-addition', name: '算式对应', icon: '🧲', desc: '找出结果相同的算式', grades: [2], gen: () => { const a = ri(2, 5) * 10; const b = ri(1, 4) * 10; const s = a + b; const opts = [`${a} + ${b}`, `${a + 10} + ${b}`, `${a} + ${b + 10}`, `${a - 10} + ${b + 5}`]; return q(`哪个算式和 ${a} + ${b} 结果相同？`, `${a} + ${b}`, { type: 'choice', options: shuffle(opts) }) } },
      { key: 'balance-equation', name: '等式平衡', icon: '⚖️', desc: '两边相等填空缺', grades: [2, 3], gen: () => { const a = ri(2, 20); const b = ri(2, 20); return q(`${a} + ? = ${a + b}`, b) } },
      { key: 'balance-builder', name: '小小平衡师', icon: '🍎', desc: '让天平两边一样重', grades: [2, 3], gen: () => { const l1 = ri(1, 9); const l2 = ri(1, 9); const r2 = ri(1, l1 + l2 - 1); return q(`左边 ${l1} + ${l2}，右边 ? + ${r2} 天平才平`, l1 + l2 - r2) } },
      { key: 'equation-pairing', name: '算式配对', icon: '🧦', desc: '结果相同就是好朋友', grades: [1, 2], gen: () => { const a = ri(2, 9); const b = ri(2, 9); const s = a + b; const opts = [`${a} + ${b}`, `${a + 1} + ${b}`, `${a} + ${b - 1}`, `${a - 2} + ${b}`]; return q(`哪个是 ${a} + ${b} 的好朋友算式（结果相同）？`, `${a} + ${b}`, { type: 'choice', options: shuffle(opts) }) } }
    ]
  },
  {
    key: 'basic-calculation',
    name: '基础计算',
    desc: '练习 20 以内加减、整十整百运算和基础算式理解',
    acts: [
      { key: 'arithmetic-facts-choice', name: '口算训练', icon: '🚀', desc: '加减基础口算天天练', grades: [1, 2, 3, 4], gen: () => genFacts(pick([20, 20, 50, 100])) },
      { key: 'no-carry-addition-k', name: '位值加法', icon: '🧱', desc: '两位数加一位数不进位', grades: [1, 2], gen: () => genNoCarryAdd([11, 88, 1, 9]) },
      { key: 'no-borrow-subtraction-k', name: '位值减法', icon: '🧱', desc: '两位数减一位数不退位', grades: [1, 2], gen: () => genNoBorrowSub([15, 99, 1, 8]) },
      { key: 'two-digit-plus-one-digit', name: '看位加法', icon: '➕', desc: '个位加个位、十位加十位', grades: [2], gen: () => genCarryAdd([11, 88, 1, 9]) },
      { key: 'two-digit-minus-one-digit', name: '整十整百减法', icon: '➖', desc: '整十数减整十数', grades: [2], gen: () => { const a = ri(2, 9) * 10; const b = ri(1, a / 10 - 1) * 10; return q(`${a} - ${b}`, a - b) } },
      { key: 'two-digit-plus-two-digit', name: '分步加减', icon: '🪜', desc: '两位数加减两位数', grades: [2, 3], gen: () => { const a = ri(11, 89); const b = ri(11, 99 - a); return Math.random() < 0.5 ? q(`${a} + ${b}`, a + b) : q(`${Math.max(a, b)} - ${Math.min(a, b)}`, Math.abs(a - b)) } },
      { key: 'place-value-addition-choice', name: '整十整百加法', icon: '💯', desc: '整百数相加', grades: [2, 3], gen: () => { const a = ri(1, 9) * 100; const b = ri(1, 9) * 100; return q(`${a} + ${b}`, a + b) } },
      { key: 'place-value-addition-principles-input', name: '加法原理', icon: '📐', desc: '按位值分步相加', grades: [3], gen: () => { const a = ri(11, 89) * 10 + ri(0, 0); const b = ri(11, 99 - a / 10) * 10 / 10 * 10; return q(`${a} + ${b}`, a + b) } },
      { key: 'place-value-subtraction-choice', name: '看位减法', icon: '➖', desc: '两位数减一位数', grades: [2], gen: () => { const a = ri(21, 99); const b = ri(1, 9); return q(`${a} - ${b}`, a - b) } },
      { key: 'column-addition-no-carry', name: '加法竖式不进位', icon: '📝', desc: '列竖式算加法', grades: [2], gen: () => genNoCarryAdd([11, 88, 11, 88]) },
      { key: 'column-addition-carry', name: '加法竖式进位', icon: '📝', desc: '个位满十进一', grades: [2, 3], gen: () => genCarryAdd([11, 88, 11, 88]) },
      { key: 'column-subtraction-no-borrow', name: '减法竖式不退位', icon: '📝', desc: '列竖式算减法', grades: [2], gen: () => genNoBorrowSub([25, 99, 11, 88]) },
      { key: 'column-subtraction-borrow', name: '减法竖式退位', icon: '📝', desc: '个位不够向十位借一', grades: [2, 3], gen: () => genBorrowSub([25, 99, 11, 88]) },
      { key: 'continuous-borrow-subtraction', name: '连续退位减法', icon: '📝', desc: '不够减就连着借位', grades: [3, 4], gen: () => { let a, b; do { a = ri(200, 999); b = ri(11, 99) } while (a % 10 >= b % 10 || Math.floor(a / 10) % 10 <= Math.floor(b / 10) % 10); return q(`${a} - ${b}`, a - b) } },
      { key: 'column-multiplication-no-carry-input', name: '乘法竖式不进位', icon: '✖️', desc: '每位相乘都不进位', grades: [3], gen: () => { let a, b; do { a = ri(11, 29); b = ri(2, 4) } while (a % 10 * b >= 10 && Math.floor(a / 10) * b >= 10); return q(`${a} × ${b}`, a * b) } },
      { key: 'column-multiplication-carry-input', name: '乘法竖式进位', icon: '✖️', desc: '两位数乘一位数', grades: [3, 4], gen: () => { const a = ri(23, 98); const b = ri(3, 9); return q(`${a} × ${b}`, a * b) } },
      { key: 'column-division-one-digit-input', name: '除法竖式基础', icon: '➗', desc: '表内除法竖式', grades: [2, 3], gen: () => genDiv(9, 9) },
      { key: 'column-division-two-digit-input', name: '除法竖式进阶', icon: '➗', desc: '商是两位数的除法', grades: [3, 4], gen: () => { const b = ri(2, 9); const qh = ri(11, 99); return q(`${b * qh} ÷ ${b}`, qh) } },
      { key: 'picture-multiplication-formula', name: '看图列乘法', icon: '🍊', desc: '几个几相加用乘法', grades: [2], gen: () => { const g = ri(2, 6); const n = ri(2, 6); return q(`每组 ${n} 个🍊，共 ${g} 组，一共有几个？`, g * n) } },
      { key: 'skip-count-multiply', name: '拆分求积', icon: '🪓', desc: '按倍数跳着数', grades: [2], gen: () => { const a = ri(2, 9); const b = ri(2, 9); return q(`${a} 的 ${b} 倍是多少？`, a * b) } },
      { key: 'times-table-choice', name: '乘法口诀', icon: '🧮', desc: '口诀表四选一', grades: [2, 3], gen: () => { const a = ri(2, 9); const b = ri(2, 9); return q(`${a} × ${b} = ？`, a * b, { type: 'choice', options: numOptions(a * b, [a, b, 10, -a, -10]) }) } },
      { key: 'sliding-multiplication-factor-pairs', name: '因数配对', icon: '🧲', desc: '哪两个数相乘得到它', grades: [2, 3], gen: () => { const a = ri(2, 9); const b = ri(2, 9); return q(`${a * b} = ${a} × ？`, b, { type: 'choice', options: numOptions(b, [1, 2, -1]) }) } },
      { key: 'hundred-application-formula-drag', name: '应用题补算式', icon: '📖', desc: '读题列式解决问题', grades: [2, 3], gen: () => { const price = ri(3, 9); const n = ri(2, 6); const pay = price * n + ri(1, 9); return q(`每支笔 ${price} 元，买 ${n} 支付了 ${pay} 元，找回几元？`, pay - price * n) } },
      { key: 'look-picture-formula', name: '看图列算式', icon: '🖼️', desc: '看图写出算式答案', grades: [1, 2], gen: () => { const a = ri(4, 9); const b = ri(1, a - 1); return q(`${'🍎'.repeat(a)} 吃掉 ${b} 个，还剩几个？`, a - b) } }
    ]
  },
  {
    key: 'advanced-calculation',
    name: '进阶计算',
    desc: '练习多位数计算、竖式、乘除法和等式关系',
    acts: [
      { key: 'decimal-column-no-carry-addition', name: '小数竖式不进位', icon: '🔸', desc: '小数加法对齐算', grades: [4, 5], gen: () => genDecAdd(1, 10) },
      { key: 'decimal-column-carry-addition', name: '小数竖式进位', icon: '🔸', desc: '小数加法满十进一', grades: [4, 5], gen: () => { const a = ri(11, 88) / 10; const b = ri(1, 9) / 10; return q(`${a.toFixed(1)} + ${b.toFixed(1)}`, Number((a + b).toFixed(2)), { dot: true }) } },
      { key: 'decimal-column-no-borrow-subtraction', name: '小数竖式不退位', icon: '🔸', desc: '小数减法对齐算', grades: [4, 5], gen: () => { const a = ri(30, 98) / 10; const b = ri(1, 9) / 10; return q(`${a.toFixed(1)} - ${b.toFixed(1)}`, Number((a - b).toFixed(2)), { dot: true }) } },
      { key: 'decimal-column-borrow-subtraction', name: '小数竖式退位', icon: '🔸', desc: '小数减法借位算', grades: [4, 5], gen: () => { const a = ri(30, 98) / 10; const b = ri((a % 1) * 10 + 1, 9) / 10; return q(`${a.toFixed(1)} - ${b.toFixed(1)}`, Number((a - b).toFixed(2)), { dot: true }) } },
      { key: 'decimal-column-multiplication', name: '小数竖式乘法', icon: '✖️', desc: '小数乘整数', grades: [5], gen: () => { const a = ri(11, 99) / 10; const b = ri(2, 9); return q(`${a.toFixed(1)} × ${b}`, Number((a * b).toFixed(2)), { dot: true }) } },
      { key: 'decimal-column-carry-multiplication', name: '小数乘法进位', icon: '✖️', desc: '积要进位的小数乘法', grades: [5], gen: () => { const a = ri(15, 98) / 10; const b = ri(3, 9); return q(`${a.toFixed(1)} × ${b}`, Number((a * b).toFixed(2)), { dot: true }) } },
      { key: 'decimal-column-division', name: '小数竖式除法', icon: '➗', desc: '小数除以整数', grades: [5], gen: () => { const b = ri(2, 9); const qt = ri(11, 49) / 10; return q(`${(b * qt).toFixed(1)} ÷ ${b}`, Number(qt.toFixed(1)), { dot: true }) } },
      { key: 'decimal-compare-number-symbols', name: '小数比大小', icon: '🔸', desc: '填 > < 或 =', grades: [4, 5], gen: () => { let a = ri(1, 99) / 10; let b = ri(1, 99) / 10; if (Math.random() < 0.15) b = a; return q(`${a.toFixed(1)} ○ ${b.toFixed(1)}`, symOf(a - b), { type: 'compare' }) } },
      { key: 'decimal-expression-compare-choice', name: '小数分数比大小', icon: '🔸', desc: '小数和分数比一比', grades: [5, 6], gen: () => { const d = pick([2, 4, 5, 10]); const n = ri(1, d - 1); const f = n / d; const dec = ri(1, 9) / 10; return q(`${dec.toFixed(1)} ○ ${fracStr(n, d)}`, symOf(dec - f), { type: 'compare' }) } },
      { key: 'decimal-most-least-number-choice', name: '小数分数最大最小', icon: '🏆', desc: '挑出最大或最小的数', grades: [5, 6], gen: () => { const s = [ri(1, 99) / 10, ri(1, 99) / 10, ri(1, 99) / 10].map((x) => Number(x.toFixed(1))); const wantMax = Math.random() < 0.5; const ans = wantMax ? Math.max(...s) : Math.min(...s); return q(`${s.map((x) => x.toFixed(1)).join('、')} 中${wantMax ? '最大' : '最小'}的是？`, ans.toFixed(1), { type: 'choice', options: shuffle(s.map((x) => x.toFixed(1))) }) } },
      { key: 'fraction-arithmetic-facts-choice', name: '分数小数口算', icon: '🍕', desc: '分数加减口算', grades: [5, 6], gen: () => genFracOp() },
      { key: 'compare-fractions-choice', name: '比较分数', icon: '🍕', desc: '同分母或同分子比较', grades: [5, 6], gen: () => { if (Math.random() < 0.5) { const d = ri(3, 9); let a = ri(1, d - 1); let b = ri(1, d - 1); if (Math.random() < 0.15) b = a; return q(`${a}/${d} ○ ${b}/${d}`, symOf(a - b), { type: 'compare' }) } const n = ri(1, 5); const d1 = ri(n + 1, n + 4); const d2 = ri(n + 5, n + 8); return q(`${n}/${d1} ○ ${n}/${d2}`, symOf(n / d1 - n / d2), { type: 'compare' }) } },
      { key: 'common-denominator-maker-choice', name: '分数通分', icon: '🧮', desc: '把分数变成同分母', grades: [5, 6], gen: () => { const d1 = ri(2, 6); const d2 = d1 * pick([2, 3]); const a = ri(1, d1 - 1); return q(`${a}/${d1} = ?/${d2}`, a * (d2 / d1), { type: 'choice', options: numOptions(a * (d2 / d1), [1, 2, -1]) }) } }
    ]
  },
  {
    key: 'patterns-reasoning',
    name: '规律与推理',
    desc: '练习找规律、奇偶判断、关系推理和简单逻辑判断',
    acts: [
      { key: 'find-the-pattern', name: '寻找规律', icon: '🔮', desc: '下一个是几', grades: [1, 2, 3, 4], gen: () => { const s = ri(1, 9); const step = pick([2, 3, 4, 5]); const seq = [s, s + step, s + 2 * step, s + 3 * step]; return q(`${seq.join('、')}、？ 按规律填数`, s + 4 * step, { type: 'choice', options: numOptions(s + 4 * step, [1, 2, step, -step]) }) } },
      { key: 'number-sequence-missing-choice', name: '数的规律排序', icon: '🪜', desc: '按规律接着排', grades: [1, 2, 3], gen: () => { const s = ri(5, 30); const step = pick([5, 10]); const seq = [s, s + step, s + 2 * step, s + 3 * step]; return q(`${seq.join('、')}、？`, s + 4 * step, { type: 'choice', options: numOptions(s + 4 * step, [1, 5, 10, -step]) }) } },
      { key: 'odd-even-number-choice', name: '奇偶数判断', icon: '⚖️', desc: '它是奇数还是偶数', grades: [2, 3], gen: () => { const n = ri(10, 99); const callEven = Math.random() < 0.5; const isEven = n % 2 === 0; const ok = callEven === isEven; return q(`${n} 是${callEven ? '偶数' : '奇数'}`, ok ? '√' : '×', { type: 'judge' }) } },
      { key: 'expression-compare-choice', name: '算式比大小', icon: '🧮', desc: '两个算式比结果', grades: [2, 3, 4], gen: () => { const m = 50; function side() { if (Math.random() < 0.5) { const x = ri(2, Math.floor(m / 2)); const y = ri(1, Math.floor(m / 2)); return { t: `${x} + ${y}`, v: x + y } } const x = ri(10, m); const y = ri(1, x - 1); return { t: `${x} - ${y}`, v: x - y } } let L = side(); let R = side(); if (Math.random() < 0.15) R = Object.assign({}, L); return q(`${L.t} ○ ${R.t}`, symOf(L.v - R.v), { type: 'compare' }) } },
      { key: 'compare-number-symbols', name: '比较数字', icon: '🆚', desc: '填 > < 或 =', grades: [1, 2, 3, 4], gen: () => genCmpNum(pick([20, 100, 1000])) },
      { key: 'compare-target-number-choice', name: '比大小选数', icon: '🎯', desc: '选出更大或更小的数', grades: [1, 2], gen: () => { const a = ri(10, 99); const b = ri(10, 99); if (a === b) { return q(`${a} 和 ${a + 1} 谁更大？`, a + 1, { type: 'choice', options: numOptions(a + 1, [1, 2, -1]) }) } const wantMax = Math.random() < 0.5; const ans = wantMax ? Math.max(a, b) : Math.min(a, b); return q(`${a} 和 ${b} 谁${wantMax ? '大' : '小'}？`, ans, { type: 'choice', options: numOptions(ans, [1, 2, -1]) }) } },
      { key: 'most-least-number-choice', name: '最大最小', icon: '🏆', desc: '三个数里挑极端', grades: [1, 2, 3], gen: () => { const s = [ri(10, 99), ri(10, 99), ri(100, 999)]; const wantMax = Math.random() < 0.5; const ans = wantMax ? Math.max(...s) : Math.min(...s); return q(`${s.join('、')} 中${wantMax ? '最大' : '最小'}的是？`, ans, { type: 'choice', options: shuffle(s.map(String)) }) } },
      { key: 'operator-symbol-fill', name: '补运算符', icon: '➕', desc: '填上正确的运算符号', grades: [2, 3], gen: () => { const type = pick(['add', 'sub', 'mul', 'div']); let a, b, ans, r; if (type === 'add') { a = ri(2, 20); b = ri(2, 20); ans = '+'; r = a + b } else if (type === 'sub') { a = ri(10, 40); b = ri(1, 9); ans = '-'; r = a - b } else if (type === 'mul') { a = ri(2, 9); b = ri(2, 9); ans = '×'; r = a * b } else { b = ri(2, 9); r = ri(2, 9); a = b * r; ans = '÷' } return q(`${a} ○ ${b} = ${r}`, ans, { type: 'choice', options: ['+', '-', '×', '÷'] }) } },
      { key: 'substitution-reasoning-choice', name: '代换关系推理', icon: '🧠', desc: '用已知推未知', grades: [3, 4], gen: () => { const a = ri(2, 9); const b = ri(1, 9); const s = a + b; return q(`△ = ${a}，△ + ○ = ${s}，○ = ？`, b, { type: 'choice', options: numOptions(b, [1, 2, a]) }) } },
      { key: 'picture-equation-reasoning-choice', name: '图文推算', icon: '🖼️', desc: '看图推出每个是多少', grades: [2, 3], gen: () => { const a = ri(2, 9); const s = a * 2; return q(`🍎 + 🍎 = ${s}，🍎 = ？`, a) } },
      { key: 'number-array-logic', name: '数阵图', icon: '🔢', desc: '让每条线的和相等', grades: [2, 3, 4], gen: () => { const a = ri(1, 9); const b = ri(1, 9); const s = a + b + ri(3, 12); return q(`三个数的和是 ${s}：${a}、${b}、？`, s - a - b) } },
      { key: 'true-or-not-k', name: '真假侦探', icon: '🕵️', desc: '这个算式说得对吗', grades: [1, 2, 3, 4], gen: () => genJudgeEq(pick([20, 50, 100])) },
      { key: 'rounding-choice', name: '取整小能手', icon: '🎯', desc: '四舍五入取整', grades: [3, 4], gen: () => { const n = ri(105, 995); const o = n % 10; const base = Math.floor(n / 10) * 10; const ans = o >= 5 ? base + 10 : base; return q(`把 ${n} 四舍五入到十位`, ans) } },
      { key: 'rounding-estimate-choice', name: '估算小能手', icon: '📝', desc: '先取整再估一估', grades: [3, 4], gen: () => { const a = ri(21, 89); const b = ri(21, 89); return q(`${a} + ${b} ≈ ？（先取整十）`, Math.round(a / 10) * 10 + Math.round(b / 10) * 10) } }
    ]
  },
  {
    key: 'geometry-figures',
    name: '几何与图形',
    desc: '练习平面图形、立体图形、空间方位和图形分割等内容',
    acts: [
      { key: 'shape-name-choice', name: '形状认一认', icon: '🔺', desc: '这是什么形状', grades: [1], gen: () => { const sh = pick([['🔺', '三角形'], ['🟦', '正方形'], ['⭕', '圆形'], ['▭', '长方形']]); const wrongs = ['三角形', '正方形', '圆形', '长方形'].filter((x) => x !== sh[1]); return q(`${sh[0]} 是什么形状？`, sh[1], { type: 'choice', options: textOptions(sh[1], wrongs) }) } },
      { key: 'shape-attributes', name: '数边数角', icon: '📐', desc: '数一数边和角', grades: [1, 2], gen: () => { const s = pick([['三角形', 3], ['正方形', 4], ['五边形', 5], ['六边形', 6]]); const askSide = Math.random() < 0.5; return q(`${s[0]}有几条${askSide ? '边' : '个角'}？`, s[1], { type: 'choice', options: numOptions(s[1], [1, 2, -1]) }) } },
      { key: 'shape-pairing', name: '图形配对', icon: '🧩', desc: '找出目标图形', grades: [1], gen: () => { const sh = pick([['🔺', '三角形'], ['⭕', '圆形'], ['🟦', '正方形'], ['🔶', '菱形']]); const pool = ['🔺', '⭕', '🟦', '🔶', '⬜', '🟠']; const opts = shuffle(pool).slice(0, 4); if (!opts.includes(sh[0])) opts[0] = sh[0]; return q(`找出${sh[1]}`, sh[0], { type: 'choice', options: shuffle(opts) }) } },
      { key: 'shape-sort-bins', name: '分类小能手', icon: '🗂️', desc: '平面还是立体', grades: [1, 2], gen: () => { const solid = pick([['正方体', '🧊'], ['圆柱', '🥫'], ['球', '⚽']]); const flat = pick([['三角形', '🔺'], ['圆形', '⭕'], ['正方形', '🟦']]); const askSolid = Math.random() < 0.5; const item = askSolid ? solid : flat; return q(`${item[1]} 是立体图形吗？`, askSolid ? '√' : '×', { type: 'judge' }) } },
      { key: 'shape-tracing', name: '图形临摹', icon: '✏️', desc: '认出图形的名字', grades: [1], gen: () => { const sh = pick([['⬢', '六边形'], ['⬟', '五边形'], ['🔻', '三角形'], ['🟡', '圆形']]); const wrongs = ['六边形', '五边形', '三角形', '圆形'].filter((x) => x !== sh[1]); return q(`${sh[0]} 是什么图形？`, sh[1], { type: 'choice', options: textOptions(sh[1], wrongs) }) } },
      { key: 'angle-type-choice', name: '认角高手', icon: '📐', desc: '锐角直角还是钝角', grades: [4], gen: () => { const deg = ri(10, 170); const ans = deg < 90 ? '锐角' : deg === 90 ? '直角' : '钝角'; const wrongs = ['锐角', '直角', '钝角'].filter((x) => x !== ans); return q(`一个角是 ${deg}°，它是什么角？`, ans, { type: 'choice', options: textOptions(ans, wrongs) }) } },
      { key: 'three-d-attribute-count-choice', name: '3D小专家', icon: '🧊', desc: '立体图形数一数', grades: [2, 3], gen: () => { const s = pick([['正方体', 6, '面'], ['正方体', 12, '条棱'], ['长方体', 6, '面'], ['圆柱', 2, '个底面']]); return q(`${s[0]}有几个${s[2]}？`, s[1], { type: 'choice', options: numOptions(s[1], [1, 2, -1]) }) } },
      { key: 'halves-fourths', name: '切切乐', icon: '🍰', desc: '平均分出的每一份', grades: [3], gen: () => { const n = pick([2, 3, 4]); const names = { 2: '二分之一', 3: '三分之一', 4: '四分之一' }; const wrongs = Object.values(names).filter((x) => x !== names[n]); return q(`把蛋糕平均分成 ${n} 块，每块是全部的几分之几？`, names[n], { type: 'choice', options: textOptions(names[n], wrongs) }) } },
      { key: 'fraction-of-shape-choice', name: '图形分数', icon: '🍕', desc: '涂色部分占几分之几', grades: [3, 4], gen: () => { const d = ri(2, 6); const n = ri(1, d - 1); const bar = '🟩'.repeat(n) + '⬜'.repeat(d - n); return q(`${bar} 涂色部分占几分之几？`, fracStr(n, d), { type: 'choice', options: shuffle([fracStr(n, d), fracStr(n, d + 1), fracStr(n + 1, d), fracStr(d - n, d)]) }) } },
      { key: 'build-perimeter-rectangle', name: '矩形建造师', icon: '🧱', desc: '算出长方形周长', grades: [3], gen: () => { const l = ri(3, 15); const w = ri(1, l - 1); return q(`长 ${l} 厘米、宽 ${w} 厘米的长方形，周长是多少厘米？`, 2 * (l + w)) } },
      { key: 'grid-direction-locate', name: '藏宝图', icon: '🗺️', desc: '用数对找位置', grades: [2, 3], gen: () => { const c = ri(1, 5); const r = ri(1, 5); const ok = Math.random() < 0.5; const sc = ok ? c : ri(1, 5); const sr = ok ? r : ri(1, 5); if (!ok && sc === c && sr === r) return q(`宝藏在第 ${c} 列第 ${r} 行，记作 (${c},${r})`, '√', { type: 'judge' }); return q(`宝藏在第 ${c} 列第 ${r} 行，记作 (${sc},${sr})`, ok ? '√' : '×', { type: 'judge' }) } }
    ]
  },
  {
    key: 'measurement-life',
    name: '测量与生活应用',
    desc: '练习长度、重量、容量、时间和平衡等生活应用内容',
    acts: [
      { key: 'length-measurement-ruler', name: '长度测量', icon: '📏', desc: '从尺子上读长度', grades: [2], gen: () => { const s = ri(1, 5); const e = s + ri(2, 8); return q(`铅笔一端对准 ${s} 厘米，另一端对准 ${e} 厘米，铅笔长几厘米？`, e - s) } },
      { key: 'order-by-length', name: '长度比拼', icon: '📊', desc: '谁长谁短排一排', grades: [2], gen: () => { const s = [ri(1, 10), ri(11, 20), ri(21, 30)]; const wantMax = Math.random() < 0.5; const ans = wantMax ? Math.max(...s) : Math.min(...s); return q(`${s.map((x) => x + '厘米').join('、')}，${wantMax ? '最长' : '最短'}的是？`, ans + '厘米', { type: 'choice', options: shuffle(s.map((x) => x + '厘米')) }) } },
      { key: 'attribute-compare-choice', name: '测量与比较', icon: '⚖️', desc: '单位和数值比大小', grades: [2, 3], gen: () => { const t = pick([['米', '厘米', 100, 1, 99], ['分米', '厘米', 10, 1, 99], ['元', '角', 10, 1, 99]]); const n1 = ri(t[3], t[4]); const n2 = ri(1, t[2] - 1); return q(`${n1} ${t[0]} ○ ${n2} ${t[1]}`, symOf(n1 * t[2] - n2), { type: 'compare' }) } },
      { key: 'unit-conversion-choice', name: '单位换算', icon: '📐', desc: '米厘米、时分、元角', grades: [2, 3, 4], gen: () => { const t = pick([['米', '厘米', 100, 1, 9], ['时', '分', 60, 1, 12], ['元', '角', 10, 1, 99], ['分', '秒', 60, 1, 30]]); const n = ri(t[3], t[4]); if (Math.random() < 0.5) return q(`${n} ${t[0]} = ？${t[1]}`, n * t[2]); return q(`${n * t[2]} ${t[1]} = ？${t[0]}`, n) } },
      { key: 'quantity-compare-choice', name: '多少比一比', icon: '🍎', desc: '数一数谁多谁少', grades: [1], gen: () => { const a = ri(2, 9); const b = ri(2, 9); if (Math.random() < 0.15) return q(`${'🍎'.repeat(a)} ○ ${'🍎'.repeat(a)}`, '=', { type: 'compare' }); return q(`${'🍎'.repeat(a)} ○ ${'🍎'.repeat(b)}`, symOf(a - b), { type: 'compare' }) } },
      { key: 'time-hour', name: '认识时间', icon: '🕐', desc: '看钟表读时间', grades: [1, 2], gen: () => { if (Math.random() < 0.5) { const h = ri(1, 12); return q(`时针指向 ${h}，分针指向 12，是几时？`, h) } const h = ri(1, 10); const add = ri(1, 12 - h); return q(`${h} 时再过 ${add} 小时是几时？`, h + add) } },
      { key: 'money-recognition-choice', name: '认识钱币', icon: '💰', desc: '钱币换算', grades: [1, 2], gen: () => { const t = pick([['10 元可以换几张 5 元？', 2], ['10 元可以换几张 2 元？', 5], ['10 元可以换几张 1 元？', 10], ['5 元可以换几个 1 元？', 5], ['1 元可以换几个 5 角？', 2]]); return q(t[0], t[1]) } },
      { key: 'money-advanced-practice', name: '钱币进阶', icon: '🛒', desc: '买东西算找零', grades: [2, 3], gen: () => { const price = ri(3, 9); const n = ri(2, 5); const pay = ri(Math.ceil((price * n + 1) / 10), Math.ceil((price * n + 1) / 10) + 3) * 10; return q(`每本本子 ${price} 元，买 ${n} 本，付了 ${pay} 元，找回几元？`, pay - price * n) } },
      { key: 'average-share-judge-choice', name: '平均分配', icon: '🍕', desc: '分得平均不平均', grades: [2, 3], gen: () => { const p = ri(2, 6); const each = ri(2, 6); const total = p * each; const ok = Math.random() < 0.5; const shown = ok ? each : each + pick([-2, -1, 1, 2]); return q(`${total} 块饼干平均分给 ${p} 人，每人 ${shown} 块`, ok ? '√' : '×', { type: 'judge' }) } },
      { key: 'read-bar-graph-choice', name: '图表会说话', icon: '📊', desc: '读统计图做比较', grades: [2, 3], gen: () => { const a = ri(3, 12); const b = ri(1, a - 1); const ask = pick([['苹果', '梨', '多几个', a - b, a], ['苹果', '梨', '多几个', a - b, a]]); const names = shuffle([['🍎', '苹果'], ['🍐', '梨'], ['🍌', '香蕉'], ['🍊', '橙子']]).slice(0, 2); return q(`${names[0][0]} 有 ${a} 个，${names[1][0]} 有 ${b} 个，${names[0][1]} 比 ${names[1][1]}${ask[2]}？`, a - b, { type: 'choice', options: numOptions(a - b, [1, 2, -1]) }) } },
      { key: 'teen-plus-number', name: '数轴加法', icon: '🛤️', desc: '在数轴上往右跳', grades: [1, 2], gen: () => { const s = ri(5, 15); const step = ri(2, 9); return q(`数轴上从 ${s} 往右跳 ${step} 格，跳到几？`, s + step) } },
      { key: 'number-line-subtraction', name: '数轴减法', icon: '🛤️', desc: '在数轴上往左跳', grades: [1, 2], gen: () => { const s = ri(10, 20); const step = ri(2, 8); return q(`数轴上从 ${s} 往左跳 ${step} 格，跳到几？`, s - step) } }
    ]
  }
]

// 汇总所有活动（每张卡配专属图案，供首页大图卡片展示；采样一次得到默认交互类型，供错题本还原）
export const LEMIAO_ACTS = LEMIAO_GROUPS.flatMap((g) =>
  g.acts.map((a) =>
    Object.assign({}, a, {
      group: g.key,
      groupName: g.name,
      img: `/static/icons/lm/${a.key}.png`
    })
  )
)
for (const a of LEMIAO_ACTS) {
  try {
    a.t = a.gen().type || 'input'
  } catch (e) {
    a.t = 'input'
  }
}

export function lemiaoAct(key) {
  return LEMIAO_ACTS.find((a) => a.key === key)
}
export function lemiaoName(key) {
  const a = lemiaoAct(key)
  return a ? a.name : '乐喵题卡'
}

// 生成一组题目（去重）
export function lemiaoGenerate(key, count) {
  const act = lemiaoAct(key)
  if (!act) return []
  const list = []
  const seen = new Set()
  let guard = 0
  while (list.length < count && guard < count * 60) {
    guard++
    const qq = act.gen()
    if (seen.has(qq.text)) continue
    seen.add(qq.text)
    list.push(Object.assign({ id: list.length + 1, mode: 'L_' + key }, qq))
  }
  return list
}
