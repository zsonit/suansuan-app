// 本地数据层：所有数据只存在本机，无账号、无网络请求
const K = {
  settings: 'ss_settings',
  wrong: 'ss_wrong',
  history: 'ss_history',
  stats: 'ss_stats',
  result: 'ss_last_result'
}

const DEFAULT_SETTINGS = {
  dailyGoal: 20, // 每日目标题数
  autoNext: true, // 答对后自动跳下一题
  haptic: true, // 答错震动反馈
  eyeCare: false // 护眼模式（米黄背景）
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

/* ---------------- 清空 ---------------- */
export function clearAll() {
  ;[K.wrong, K.history, K.stats, K.result].forEach((k) => {
    try {
      uni.removeStorageSync(k)
    } catch (e) {}
  })
}
