// 专注锁定（家长控制）
// 原生开关/配置存 Android SharedPreferences("kiosk")，由 KioskService 读取；
// 浏览器环境（无 Capacitor）自动降级为不生效的空实现。

const KEY = 'kiosk' // 浏览器降级时的存储 key
export const QUESTIONS = [
  '孩子最喜欢的动画片是？',
  '家里的 Wi-Fi 名字是？',
  '你的手机尾号后四位是？',
  '孩子最好的朋友叫什么？'
]

function cap() {
  try {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Kiosk
  } catch (e) {
    return null
  }
}

export async function sha256(text) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    // 极老 WebView 无 crypto.subtle，退化 hash（自用 App 够用）
    let h = 5381
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
    return 'f' + (h >>> 0).toString(16)
  }
}

export function randCode() {
  let s = ''
  for (let i = 0; i < 8; i++) s += Math.floor(Math.random() * 10)
  return s.slice(0, 4) + '-' + s.slice(4)
}

export async function getConfig() {
  const p = cap()
  if (!p) return uni.getStorageSync(KEY) || null
  const r = await p.getConfig()
  return r && r.json ? JSON.parse(r.json) : null
}

export async function saveConfig(cfg) {
  const p = cap()
  if (!p) {
    uni.setStorageSync(KEY, cfg)
    return
  }
  await p.saveConfig({ json: JSON.stringify(cfg) })
}

export async function setEnabled(on) {
  const p = cap()
  if (p) await p.setEnabled({ enabled: !!on })
}

export async function isEnabled() {
  const p = cap()
  if (!p) return false
  const r = await p.isEnabled()
  return !!(r && r.enabled)
}

export async function isServiceOn() {
  const p = cap()
  if (!p) return false
  const r = await p.isServiceOn()
  return !!(r && r.on)
}

export async function openAccessibilitySettings() {
  const p = cap()
  if (p) await p.openAccessibilitySettings()
}

/* ---------------- 任何模式都能弹回：系统权限 ---------------- */
// 查询：忽略电池优化（省电模式/Doze）、悬浮窗（后台弹出界面）
export async function getPowerStatus() {
  const p = cap()
  if (!p) return { batteryIgnored: true, overlay: true, sdk: 0 }
  try {
    const r = await p.powerStatus()
    return {
      batteryIgnored: !!(r && r.batteryIgnored),
      overlay: !!(r && r.overlay),
      sdk: (r && r.sdk) || 0
    }
  } catch (e) {
    return { batteryIgnored: true, overlay: true, sdk: 0 }
  }
}

// 申请忽略电池优化（省电模式 / 后台限制下依然能定时拉回）
export async function openBatterySettings() {
  const p = cap()
  if (p) await p.openBatterySettings()
}

// 申请悬浮窗权限（允许后台弹出界面，Android 10+ 后台启动限制的关键豁免）
export async function openOverlaySettings() {
  const p = cap()
  if (p) await p.openOverlaySettings()
}

// 国产 ROM 的自启动 / 后台运行管理页
export async function openAutoStartSettings() {
  const p = cap()
  if (p) await p.openAutoStartSettings()
}

// 取出并清除「强制挑战」标记（被无障碍服务拉回时写入，重启后仍有效）
export async function takeForceChallenge() {
  const p = cap()
  if (!p) return false
  try {
    const r = await p.takeForceChallenge()
    return !!(r && r.force)
  } catch (e) {
    return false
  }
}

// 回到桌面（让孩子去看视频）
export async function goHome() {
  const p = cap()
  if (p) await p.goHome()
}

// 先学再看：暂停拉回 min 分钟（原生持久化，App 被杀也生效），然后回桌面
export async function startUnlock(min) {
  const p = cap()
  if (!p) return false
  await p.suspend({ ms: min * 60 * 1000 })
  await p.goHome()
  return true
}

export async function verifyPin(cfg, pin) {
  if (!cfg || !pin) return false
  return (await sha256(cfg.salt + ':' + pin)) === cfg.pinHash
}

export async function verifyAnswer(cfg, answer) {
  if (!cfg || !answer) return false
  const norm = String(answer).trim().toLowerCase()
  return (await sha256(cfg.salt + ':a:' + norm)) === cfg.ansHash
}

// 找回凭证：手机号（用户自己设置），hash 后存 cfg.phoneHash
// 兼容旧版随机恢复码（cfg.recovery）
export function recoveryCode() {
  return 'SS-' + randCode()
}

export async function verifyPhone(cfg, phone) {
  if (!cfg || !phone) return false
  const p = String(phone).replace(/\D/g, '')
  if (cfg.phoneHash && (await sha256(cfg.salt + ':p:' + p)) === cfg.phoneHash) return true
  // 旧版配置：随机恢复码
  if (cfg.recovery && ('SS-' + p === String(cfg.recovery).toUpperCase() || p === String(cfg.recovery).replace(/\D/g, ''))) return true
  return false
}

// 防暴力试错：连错 5 次锁 5 分钟
const LOCK_KEY = 'kiosk_lockout'
export function lockoutLeft() {
  const until = uni.getStorageSync(LOCK_KEY) || 0
  return Math.max(0, until - Date.now())
}
export function addWrongAttempt() {
  const n = (uni.getStorageSync(LOCK_KEY + '_n') || 0) + 1
  uni.setStorageSync(LOCK_KEY + '_n', n)
  if (n >= 5) {
    uni.setStorageSync(LOCK_KEY, Date.now() + 5 * 60 * 1000)
    uni.setStorageSync(LOCK_KEY + '_n', 0)
  }
  return n
}
export function resetAttempts() {
  uni.setStorageSync(LOCK_KEY + '_n', 0)
}

/* ---------------- 家长门禁 ----------------
   设置过锁定密码后，进「我的」/「练习设置」要先输密码；
   同一次 App 会话内验证一次即放行，App 重启后重新上锁 */
let gateOk = false
export function gateOpen() {
  return gateOk
}
export function gatePass() {
  gateOk = true
}
export async function gateNeeded() {
  const c = await getConfig()
  return !!(c && c.pinHash)
}
