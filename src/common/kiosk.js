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

export async function verifyPin(cfg, pin) {
  if (!cfg || !pin) return false
  return (await sha256(cfg.salt + ':' + pin)) === cfg.pinHash
}

export async function verifyAnswer(cfg, answer) {
  if (!cfg || !answer) return false
  const norm = String(answer).trim().toLowerCase()
  return (await sha256(cfg.salt + ':a:' + norm)) === cfg.ansHash
}

// 恢复码：SS- 开头前缀 + 8 位数字，格式 SS-1234-5678
export function recoveryCode() {
  return 'SS-' + randCode()
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
