// 家长远程控制（云端通道）。
// 原则：云功能只是叠加层——任何网络错误都被静默吞掉，
// 不影响本地规则（专注锁定 / 每日任务 / 挑战赛 / 家长门禁）的正常运行。
import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk'
import {
  getWatchRules, saveWatchRules, getWatchUsed, getWatchEarned, watchAvailable,
  getDailyProgress, getChallengeDone, setUnlockUntil, saveSettings, getSettings,
  getGradeInfo, setGradeByParent, allowChildGrade
} from '@/common/store'

const cloud = createWorkBuddyCloud({
  endpoint: 'https://suansuan-parent.app.workbuddy.host',
  publishableKey: 'wbpk_lqghRoJfudpKXkOh3KcMou_3e0crzzG91T1bV6tYf9rUvk2FOHTsWuk'
})

export const CONSOLE_URL = 'https://suansuan-parent.app.workbuddy.host'

/* ---------------- 本地配置 ---------------- */
const KEY = 'ss_remote'

function readCfg() {
  try {
    const v = uni.getStorageSync(KEY)
    if (!v) return { on: false, code: '', name: '' }
    return typeof v === 'string' ? JSON.parse(v) : v
  } catch (e) {
    return { on: false, code: '', name: '' }
  }
}

function writeCfg(cfg) {
  try {
    uni.setStorageSync(KEY, JSON.stringify(cfg))
  } catch (e) { /* 静默 */ }
}

export function getRemoteCfg() {
  return readCfg()
}

function randPairCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

/* ---------------- 状态 ---------------- */
let timer = null
let busy = false
let status = 'off' // off | ok | err
let lastErr = ''

export function remoteStatus() {
  const cfg = readCfg()
  return { on: !!cfg.on, code: cfg.code || '', name: cfg.name || '', status, lastErr }
}

/* ---------------- 孩子端：开启 / 关闭 ---------------- */
export function enableRemote(name) {
  const cfg = readCfg()
  if (!cfg.code) cfg.code = randPairCode()
  if (name) cfg.name = String(name).slice(0, 12) || '孩子的设备'
  if (!cfg.name) cfg.name = '孩子的设备'
  cfg.on = true
  writeCfg(cfg)
  ensureDevice(cfg)
  start()
  return cfg
}

export function setRemoteName(name) {
  const cfg = readCfg()
  cfg.name = String(name || '').slice(0, 12) || '孩子的设备'
  writeCfg(cfg)
  ensureDevice(cfg)
  return cfg
}

export function disableRemote() {
  const cfg = readCfg()
  cfg.on = false
  writeCfg(cfg)
  stop()
}

export function start() {
  const cfg = readCfg()
  if (!cfg.on || timer) return
  cycle()
  timer = setInterval(cycle, 6000)
}

export function stop() {
  if (timer) { clearInterval(timer); timer = null }
  status = 'off'
}

/* ---------------- 孩子端：轮询指令 + 心跳 ---------------- */
function snapState() {
  const gi = getGradeInfo()
  return {
    watchUsed: getWatchUsed(),
    watchEarned: getWatchEarned(),
    avail: watchAvailable(),
    dailyDone: getDailyProgress().done,
    chalDone: getChallengeDone(),
    grade: gi.grade,
    gradeLocked: gi.locked,
    gradeBase: gi.base,
    gradeSince: gi.since,
    gradeNextUp: gi.nextUpAt,
    rules: getWatchRules()
  }
}

async function ensureDevice(cfg) {
  await cloud.database.from('devices').upsert(
    { code: cfg.code, name: cfg.name },
    { onConflict: 'code' }
  )
}

async function cycle() {
  if (busy) return
  const cfg = readCfg()
  if (!cfg.on || !cfg.code) return
  busy = true
  try {
    const now = new Date().toISOString()
    // 1. 心跳 + 状态上报
    await cloud.database.from('devices').update({ online_at: now, state: snapState() }).eq('code', cfg.code)
    // 2. 拉取待执行指令
    const { data: cmds } = await cloud.database
      .from('commands')
      .select('*')
      .eq('code', cfg.code)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)
    for (const c of cmds || []) {
      let ok = true
      let result = null
      try {
        result = await execCommand(c)
      } catch (e) {
        ok = false
        result = { error: String((e && e.message) || e) }
      }
      try {
        await cloud.database.from('commands')
          .update({ status: ok ? 'done' : 'failed', result, done_at: new Date().toISOString() })
          .eq('id', c.id)
      } catch (e2) { /* 标记失败下次可能重复执行，可接受 */ }
    }
    status = 'ok'
    lastErr = ''
  } catch (e) {
    status = 'err'
    lastErr = String((e && e.message) || e)
  }
  busy = false
}

async function execCommand(c) {
  const p = c.payload || {}
  try {
    const d = await import('@/common/diag')
    d.logLine('remote', '收到家长指令 ' + c.type + ' ' + JSON.stringify(p).slice(0, 80))
  } catch (e) {
    // 忽略
  }
  switch (c.type) {
    case 'unlock': {
      const kiosk = await import('@/common/kiosk')
      await kiosk.startUnlock(Math.max(1, Math.min(720, Number(p.minutes) || 5)))
      return { unlocked: p.minutes || 5 }
    }
    case 'lock_now': {
      setUnlockUntil(0)
      const kiosk = await import('@/common/kiosk')
      await kiosk.lockNow()
      return { locked: true }
    }
    case 'set_rules': {
      if (p.rules && typeof p.rules === 'object') {
        saveWatchRules(p.rules)
        return { rules: getWatchRules() }
      }
      return { noop: true }
    }
    case 'set_grade': {
      const g = Number(p.grade)
      if (!(g >= 0 && g <= 6)) return { noop: true }
      if (p.lock === false) {
        // 家长放权：孩子可在设备上自选年级
        saveSettings({ grade: g, gradeBase: g })
        allowChildGrade()
      } else {
        // 家长设定：锁定年级，孩子端只能做该年级的题；9 月 1 日自动升一级
        setGradeByParent(g)
      }
      return { grade: getGradeInfo() }
    }
    case 'msg': {
      const text = String(p.text || '').slice(0, 200)
      if (text) {
        uni.showModal({ title: '来自爸爸妈妈', content: text, showCancel: false, confirmText: '知道了' })
      }
      return { shown: !!text }
    }
    case 'ping':
      return { pong: true }
    default:
      return { noop: true }
  }
}

/* ---------------- 孩子端：做题报告上报 ---------------- */
export function reportSession(rec) {
  const cfg = readCfg()
  if (!cfg.on || !cfg.code || !rec) return
  const data = {
    source: rec.source || rec.mode || '',
    label: rec.label || '',
    total: rec.total || 0,
    right: rec.right || 0,
    grade: rec.grade || (getSettings().grade || 1),
    durationMs: rec.durationMs || 0,
    wrong: (rec.wrong || []).slice(0, 20).map((w) => ({
      text: w.text, answer: w.answer, your: w.your
    }))
  }
  cloud.database.from('reports').insert({ code: cfg.code, kind: 'session', data })
    .then(() => {})
    .catch(() => { /* 静默：报告失败不影响本地 */ })
}

/* ---------------- 家长端（APP 内控制台 / 网页共用） ---------------- */
const PARENT_KEY = 'ss_parent_devices'

function readBound() {
  try {
    const v = uni.getStorageSync(PARENT_KEY)
    if (!v) return []
    const arr = typeof v === 'string' ? JSON.parse(v) : v
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

function writeBound(arr) {
  try {
    uni.setStorageSync(PARENT_KEY, JSON.stringify(arr))
  } catch (e) { /* 静默 */ }
}

export function parentListBound() {
  return readBound()
}

// 绑定一台孩子设备（校验配对码真实存在）
export async function parentBind(codeRaw) {
  const code = String(codeRaw || '').trim().toUpperCase()
  if (!/^[A-Z0-9]{8}$/.test(code)) throw new Error('配对码是 8 位字母数字')
  const { data, error } = await cloud.database.from('devices').select('code, name').eq('code', code).maybeSingle()
  if (error) throw new Error('网络异常，请稍后再试')
  if (!data) throw new Error('没有找到这个配对码，请在孩子设备的「设置 → 家长远程控制」里查看')
  const arr = readBound().filter((d) => d.code !== code)
  arr.unshift({ code, name: data.name || '孩子的设备' })
  writeBound(arr)
  return arr
}

export function parentUnbind(code) {
  writeBound(readBound().filter((d) => d.code !== code))
}

// 下发指令（resolve 后只代表已送达云端，执行结果由设备轮询完成）
export async function parentSend(code, type, payload) {
  const { error } = await cloud.database.from('commands')
    .insert({ code, type, payload: payload || {} })
  if (error) throw new Error('发送失败：' + (error.message || '网络异常'))
}

// 拉取设备实时状态（在线判断：30 秒内有心跳）
export async function parentFetchDevice(code) {
  const { data } = await cloud.database.from('devices').select('*').eq('code', code).maybeSingle()
  if (!data) return null
  const online = data.online_at && (Date.now() - new Date(data.online_at).getTime()) < 30000
  return Object.assign({}, data, { online })
}

// 拉取最近的做题报告
export async function parentFetchReports(code, limit = 20) {
  const { data } = await cloud.database.from('reports')
    .select('*')
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}
