// 本地数据层：所有数据只存在本机，无账号、无网络请求
const K = {
  settings: 'ss_settings',
  wrong: 'ss_wrong',
  history: 'ss_history',
  stats: 'ss_stats',
  result: 'ss_last_result',
  watchRules: 'ss_watch_rules',
  watchState: 'ss_watch_state',
  watchUnlock: 'ss_watch_unlock'
}

const DEFAULT_SETTINGS = {
  dailyGoal: 20, // 每日目标题数
  autoNext: true, // 答对后自动跳下一题
  haptic: true, // 答错震动反馈
  eyeCare: false, // 护眼模式（米黄背景）
  sound: true, // 音效（答对/答错/游戏音）
  voice: true // 语音鼓励（TTS）
}

function read(key, fallback) {
  try {
    const v = uni.getStorageSync(key)
    if (v === '' || v === null || v === undefined) return fallback
    return typeof v === 'string' ? JSON.parse(v) : v
  } catch (e) {
    return fallback
  }
}

function write(key, val) {
  try {
    uni.setStorageSync(key, JSON.stringify(val))
  } catch (e) {
    /* 存储失败静默处理 */
  }
}

export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/* ---------------- 设置 ---------------- */
export function getSettings() {
  return Object.assign({}, DEFAULT_SETTINGS, read(K.settings, {}))
}

export function saveSettings(patch) {
  const next = Object.assign(getSettings(), patch || {})
  write(K.settings, next)
  return next
}

/* ---------------- 统计 ---------------- */
export function getStats() {
  const s = read(K.stats, null)
  if (!s || typeof s !== 'object') return { total: 0, right: 0, days: {} }
  return { total: s.total || 0, right: s.right || 0, days: s.days || {} }
}

export function getToday() {
  const s = getStats()
  return s.days[dayKey()] || { n: 0, right: 0 }
}

export function getHistory() {
  return read(K.history, []) || []
}

// 一次练习结束后落库
export function addRecord(rec) {
  const stats = getStats()
  stats.total += rec.total || 0
  stats.right += rec.right || 0
  const k = dayKey()
  if (!stats.days[k]) stats.days[k] = { n: 0, right: 0 }
  stats.days[k].n += rec.total || 0
  stats.days[k].right += rec.right || 0
  write(K.stats, stats)

  const h = getHistory()
  h.unshift({
    ts: Date.now(),
    mode: rec.mode || '',
    total: rec.total || 0,
    right: rec.right || 0,
    durationMs: rec.durationMs || 0
  })
  write(K.history, h.slice(0, 100))
}

// 连续练习天数（今天或昨天有练习才算连着）
export function getStreak() {
  const stats = getStats()
  const one = 86400000
  let cursor = new Date()
  if (!stats.days[dayKey(cursor)]) {
    cursor = new Date(cursor.getTime() - one)
    if (!stats.days[dayKey(cursor)]) return 0
  }
  let n = 0
  while (stats.days[dayKey(cursor)] && stats.days[dayKey(cursor)].n > 0) {
    n++
    cursor = new Date(cursor.getTime() - one)
  }
  return n
}

/* ---------------- 错题本 ---------------- */
export function getWrong() {
  const map = read(K.wrong, {}) || {}
  return Object.values(map).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0))
}

export function addWrong(q) {
  const map = read(K.wrong, {}) || {}
  const key = q.text
  const cur = map[key]
  map[key] = {
    text: q.text,
    answer: q.answer,
    mode: q.mode || '',
    type: q.type || (cur && cur.type) || undefined,
    options: q.options || (cur && cur.options) || undefined,
    count: (cur ? cur.count : 0) + 1,
    lastTs: Date.now()
  }
  write(K.wrong, map)
}

export function removeWrong(text) {
  const map = read(K.wrong, {}) || {}
  delete map[text]
  write(K.wrong, map)
}

export function clearWrong() {
  write(K.wrong, {})
}

/* ---------------- 一次性结果传递 ---------------- */
export function saveResult(rec) {
  write(K.result, rec)
}

export function takeResult() {
  const r = read(K.result, null)
  return r
}

/* ---------------- 先学再看（答题解锁观看时间） ---------------- */
// 规则：每天先做 baseQ 道题，赚满 base 分钟基础时间（每道 base/baseQ 分钟）；
//       赚满后每做一道题再 +perQ 分钟；不设固定上限。时间不是白送的，全靠做题赚。
const DEFAULT_WATCH_RULES = { on: false, base: 30, baseQ: 20, perQ: 1 }

export function getWatchRules() {
  return Object.assign({}, DEFAULT_WATCH_RULES, read(K.watchRules, {}))
}

export function saveWatchRules(patch) {
  const next = Object.assign(getWatchRules(), patch || {})
  write(K.watchRules, next)
  return next
}

// 今日观看账户（跨天自动清零）：used=已领用(已看)分钟，earned=做题赚的分钟
function todayWatch() {
  const s = read(K.watchState, null) || {}
  if (s.date !== dayKey()) return { date: dayKey(), used: 0, earned: 0 }
  return { date: s.date, used: s.used || 0, earned: s.earned || 0 }
}

export function getWatchUsed() {
  return todayWatch().used
}

export function getWatchEarned() {
  return todayWatch().earned
}

// 每做一道题调用一次：n = 本次做的题数
// 阶段一（还没赚满基础时间）：每道题赚 base/baseQ 分钟，最多累计到 base
// 阶段二（已赚满基础时间）：每道题 +perQ 分钟
export function addWatchEarned(n) {
  const r = getWatchRules()
  const s = todayWatch()
  const base = r.base || 0
  const perBase = base / Math.max(1, r.baseQ || 20)
  let cnt = n || 1
  while (cnt-- > 0) {
    if (base > 0 && s.earned < base) {
      s.earned = Math.min(base, s.earned + perBase)
    } else {
      s.earned += r.perQ || 1
    }
  }
  write(K.watchState, s)
  return s.earned
}

// 还能看 = max(0, 赚的 - 已看)（基础时间也是做题赚来的，不是白送的）
export function watchAvailable() {
  const s = todayWatch()
  return Math.max(0, s.earned - s.used)
}

// 基础时间进度（供 UI 展示）：done=已完成题数 need=还差几道题赚满
export function watchBaseProgress() {
  const r = getWatchRules()
  const s = todayWatch()
  const base = r.base || 0
  const perBase = base / Math.max(1, r.baseQ || 20)
  if (base <= 0 || s.earned >= base) {
    return { phase: 2, done: r.baseQ || 20, need: 0, perBase }
  }
  const done = Math.min(r.baseQ || 20, Math.floor(s.earned / perBase + 1e-6))
  return { phase: 1, done, need: Math.ceil((base - s.earned) / perBase - 1e-6), perBase }
}

// 领用全部可用分钟：记入已用、设定解锁截止时间戳，返回本次解锁分钟数
export function claimWatch() {
  const m = watchAvailable()
  if (m <= 0) return 0
  const s = todayWatch()
  s.used += m
  write(K.watchState, s)
  setUnlockUntil(Date.now() + m * 60 * 1000)
  return m
}

// 当前解锁截止时间戳（0 = 未解锁）
export function getUnlockUntil() {
  return read(K.watchUnlock, 0) || 0
}

export function setUnlockUntil(ts) {
  write(K.watchUnlock, ts)
}

/* ---------------- 清空 ---------------- */
export function clearAll() {
  ;[K.wrong, K.history, K.stats, K.result].forEach((k) => {
    try {
      uni.removeStorageSync(k)
    } catch (e) {}
  })
}
