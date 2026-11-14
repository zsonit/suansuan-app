// 检修日志：记录锁定/无障碍/拉回/云指令等关键事件，可一键导出
// 浏览器环境降级为存本地 storage（App 内走原生文件日志）

const FB_KEY = 'diag_lines'
const FB_ON = 'diag_on'

function cap() {
  try {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Diag
  } catch (e) {
    return null
  }
}

function fbOn() {
  return !!uni.getStorageSync(FB_ON)
}

export async function diagStatus() {
  const p = cap()
  if (!p) return { on: fbOn(), size: (uni.getStorageSync(FB_KEY) || '').length }
  try {
    const r = await p.status()
    return { on: !!(r && r.on), size: (r && r.size) || 0 }
  } catch (e) {
    return { on: false, size: 0 }
  }
}

export async function setDiag(on) {
  const p = cap()
  if (!p) {
    uni.setStorageSync(FB_ON, !!on)
    return !!on
  }
  try {
    await p.setEnabled({ on: !!on })
  } catch (e) {
    // 忽略
  }
  return !!on
}

// 记一条：tag 用短英文标签（a11y / kiosk / pull / remote / app）
export async function logLine(tag, msg) {
  const p = cap()
  if (!p) {
    if (!fbOn()) return
    const t = new Date()
    const hh = String(t.getHours()).padStart(2, '0')
    const mm = String(t.getMinutes()).padStart(2, '0')
    const ss = String(t.getSeconds()).padStart(2, '0')
    const old = uni.getStorageSync(FB_KEY) || ''
    const lines = (old + `${hh}:${mm}:${ss} [${tag}] ${msg}\n`).split('\n')
    uni.setStorageSync(FB_KEY, lines.slice(-500).join('\n'))
    return
  }
  try {
    await p.log({ tag: String(tag || 'app'), msg: String(msg == null ? '' : msg) })
  } catch (e) {
    // 忽略
  }
}

export async function tailLog(lines = 200) {
  const p = cap()
  if (!p) return uni.getStorageSync(FB_KEY) || ''
  try {
    const r = await p.tail({ lines })
    return (r && r.text) || ''
  } catch (e) {
    return ''
  }
}

export async function systemInfo() {
  const p = cap()
  if (!p) return '（网页版不采集设备信息）'
  try {
    const r = await p.systemInfo()
    return (r && r.text) || ''
  } catch (e) {
    return ''
  }
}

// 导出：App 内写 txt 并调起系统分享（微信/邮件/文件），返回 { path, text }
export async function exportLog() {
  const p = cap()
  if (!p) {
    return { path: '', text: await tailLog(500) }
  }
  try {
    const r = await p.export()
    return { path: (r && r.path) || '', text: (r && r.text) || '' }
  } catch (e) {
    return { path: '', text: '' }
  }
}

export async function clearLog() {
  const p = cap()
  if (!p) {
    uni.removeStorageSync(FB_KEY)
    return
  }
  try {
    await p.clear()
  } catch (e) {
    // 忽略
  }
}

// 复制到剪贴板（网页版/分享失败时兜底）
export function copyText(text) {
  try {
    uni.setClipboardData({
      data: String(text || ''),
      success: () => uni.showToast({ title: '已复制', icon: 'success' })
    })
  } catch (e) {
    uni.showToast({ title: '复制失败', icon: 'none' })
  }
}
