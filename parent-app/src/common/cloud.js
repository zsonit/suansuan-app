// 家长端云通道：只做「读孩子设备状态 / 下发指令 / 读做题报告」三件事。
// 全部走 https + publishableKey，配对码是唯一凭证（8 位、不可猜）。
import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk'

export const ENDPOINT = 'https://suansuan-parent.app.workbuddy.host'
export const WEB_CONSOLE = 'https://suansuan-parent.app.workbuddy.host'

const cloud = createWorkBuddyCloud({
  endpoint: ENDPOINT,
  publishableKey: 'wbpk_lqghRoJfudpKXkOh3KcMou_3e0crzzG91T1bV6tYf9rUvk2FOHTsWuk'
})
const db = cloud.database

export const GRADE_NAMES = ['全年级', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级']

export const DEFAULT_RULES = {
  on: true,
  dailyQ: 30,
  dailyMin: 30,
  chalQ: 20,
  chalMin: 30,
  perQ: 1
}

/* ---------------- 本地已绑定设备 ---------------- */
const KEY = 'sp_bound_devices'

export function listBound() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (!raw) return []
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

function saveBound(arr) {
  try {
    uni.setStorageSync(KEY, JSON.stringify(arr))
  } catch (e) { /* 静默 */ }
}

/* ---------------- 绑定 / 解绑 ---------------- */
export async function bind(codeRaw) {
  const code = String(codeRaw || '').trim().toUpperCase()
  if (!/^[A-Z0-9]{8}$/.test(code)) throw new Error('配对码是 8 位字母数字')
  let data = null
  try {
    const res = await db.from('devices').select('code, name').eq('code', code).maybeSingle()
    if (res.error) throw new Error('网络异常，请检查网络后重试')
    data = res.data
  } catch (e) {
    if (String(e && e.message).indexOf('网络') > -1) throw e
    throw new Error('网络异常，请检查网络后重试')
  }
  if (!data) throw new Error('没有找到这个配对码，请在孩子设备「设置 → 家长远程控制」里核对')
  const arr = listBound().filter((d) => d.code !== code)
  arr.unshift({ code, name: data.name || '孩子的设备' })
  saveBound(arr)
  return arr
}

export function unbind(code) {
  saveBound(listBound().filter((d) => d.code !== code))
}

export function renameLocal(code, name) {
  const arr = listBound().map((d) => (d.code === code ? Object.assign({}, d, { name }) : d))
  saveBound(arr)
}

/* ---------------- 读设备 ---------------- */
export async function getDevice(code) {
  const { data, error } = await db.from('devices').select('*').eq('code', code).maybeSingle()
  if (error) throw new Error('网络异常，请稍后重试')
  if (!data) return null
  const t = data.online_at ? new Date(data.online_at).getTime() : 0
  const online = !!t && Date.now() - t < 35000
  return {
    code: data.code,
    name: data.name || '孩子的设备',
    online,
    onlineAt: t,
    state: data.state || {}
  }
}

export async function refreshAll(codes) {
  const out = {}
  for (const code of codes || []) {
    try {
      out[code] = await getDevice(code)
    } catch (e) {
      out[code] = null
    }
  }
  return out
}

/* ---------------- 下发指令 ---------------- */
// 指令由孩子设备轮询取走执行；这里 resolve 只代表已送达云端
export async function send(code, type, payload) {
  try {
    const { error } = await db.from('commands').insert({ code, type, payload: payload || {} })
    if (error) throw new Error(error.message || '发送失败')
  } catch (e) {
    throw new Error('发送失败，请检查网络后重试')
  }
}

export const unlock = (code, minutes) => send(code, 'unlock', { minutes })
export const lockNow = (code) => send(code, 'lock_now', {})
export const ping = (code) => send(code, 'ping', {})
export const message = (code, text) => send(code, 'msg', { text })
export const setRules = (code, rules) => send(code, 'set_rules', { rules })
export const setGrade = (code, grade) => send(code, 'set_grade', { grade })

// 设备重命名：家长端直接改云端记录，孩子端下次心跳后同步
export async function renameDevice(code, name) {
  try {
    await db.from('devices').update({ name }).eq('code', code)
  } catch (e) { /* 静默 */ }
  renameLocal(code, name)
}

/* ---------------- 读报告 ---------------- */
export async function getReports(code, limit = 20) {
  try {
    const { data, error } = await db.from('reports')
      .select('*')
      .eq('code', code)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data || []
  } catch (e) {
    return []
  }
}

/* ---------------- 小工具 ---------------- */
export function onlineText(ts) {
  if (!ts) return '从未上线'
  const d = Date.now() - ts
  if (d < 40000) return '刚刚在线'
  if (d < 3600000) return Math.floor(d / 60000) + ' 分钟前在线'
  if (d < 86400000) return Math.floor(d / 3600000) + ' 小时前在线'
  const days = Math.floor(d / 86400000)
  if (days === 1) return '昨天在线'
  if (days < 30) return days + ' 天前在线'
  return '很久没上线'
}

export function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  const now = new Date()
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (sameDay) return '今天 ' + hm
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hm
}

export function sessionLabel(r) {
  const d = (r && r.data) || {}
  const map = { daily: '每日任务', challenge: '挑战赛', '': '自由练习' }
  if (d.label) return d.label
  return map[d.source] !== undefined ? map[d.source] : (d.source || '练习')
}

export function accuracy(r) {
  const d = (r && r.data) || {}
  return d.total ? Math.round((d.right / d.total) * 100) : 0
}

export function toast(title, icon) {
  uni.showToast({ title: String(title || '').slice(0, 24), icon: icon || 'none', duration: 1800 })
}
