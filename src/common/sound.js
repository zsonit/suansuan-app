// 音效引擎：全部本地合成（Web Audio），无外部音频文件
// sfx('right'|'wrong'|'pop'|'flip'|'match'|'combo'|'win'|'click') 播音效
// speak(text) 语音鼓励（浏览器 TTS，中文）
import { getSettings } from './store'

let ctx = null

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      return null
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

// 单音：freq 起，滑到 endFreq（可选），dur 秒，when 秒后开始
function tone(freq, dur, opts = {}) {
  const a = ac()
  if (!a) return
  const { endFreq, type = 'sine', vol = 0.18, when = 0, attack = 0.005 } = opts
  const t0 = a.currentTime + when
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

// 噪声爆点（气球爆破）
function popSound() {
  const a = ac()
  if (!a) return
  const dur = 0.14
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
  }
  const src = a.createBufferSource()
  src.buffer = buf
  const g = a.createGain()
  g.gain.value = 0.3
  const f = a.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 2400
  src.connect(f).connect(g).connect(a.destination)
  src.start()
}

const RECIPES = {
  // 答对：上行三连音
  right: () => {
    tone(523, 0.12, { vol: 0.16 })
    tone(659, 0.12, { when: 0.09, vol: 0.16 })
    tone(784, 0.2, { when: 0.18, vol: 0.18 })
  },
  // 答错：低频下滑
  wrong: () => {
    tone(220, 0.28, { endFreq: 150, type: 'sawtooth', vol: 0.12 })
    tone(180, 0.24, { endFreq: 120, type: 'square', vol: 0.06, when: 0.02 })
  },
  // 气球爆破
  pop: () => {
    popSound()
    tone(880, 0.1, { endFreq: 1400, vol: 0.1, when: 0.02 })
  },
  // 翻牌轻响
  flip: () => {
    tone(660, 0.07, { type: 'triangle', vol: 0.12 })
  },
  // 配对成功：清脆双音
  match: () => {
    tone(659, 0.1, { type: 'triangle', vol: 0.16 })
    tone(988, 0.18, { type: 'triangle', vol: 0.16, when: 0.08 })
  },
  // 连击：音高随连击数上升
  combo: (n = 2) => {
    const base = 440 * Math.pow(1.06, Math.min(n, 12))
    tone(base, 0.09, { type: 'square', vol: 0.08 })
    tone(base * 1.5, 0.14, { type: 'square', vol: 0.1, when: 0.06 })
  },
  // 胜利小号角
  win: () => {
    const seq = [523, 659, 784, 1047]
    seq.forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.14, { type: 'triangle', vol: 0.17, when: i * 0.14 }))
    tone(1319, 0.6, { type: 'sine', vol: 0.12, when: 0.56 })
  },
  // 结束（成绩一般）：温柔两音
  soft: () => {
    tone(523, 0.25, { type: 'sine', vol: 0.14 })
    tone(659, 0.4, { type: 'sine', vol: 0.12, when: 0.2 })
  },
  // 开始
  start: () => {
    tone(440, 0.1, { type: 'triangle', vol: 0.12 })
    tone(880, 0.16, { type: 'triangle', vol: 0.14, when: 0.08 })
  },
  // 点按
  click: () => {
    tone(880, 0.05, { type: 'triangle', vol: 0.08 })
  }
}

export function sfx(name, arg) {
  const s = getSettings()
  if (!s.sound) return
  const fn = RECIPES[name]
  if (fn) {
    try {
      fn(arg)
    } catch (e) {}
  }
}

// 语音鼓励
export const CHEERS_RIGHT = ['答对啦，真棒！', '太厉害了！', '你真聪明！', '好样的！', '完全正确！']
export const CHEERS_STREAK = ['连续答对，太厉害啦！', '火力全开！', '无敌啦！', '小脑瓜真灵！']
export const CHEERS_END_GOOD = ['全部答对，你太棒了！', '满分！继续加油！', '真是数学小达人！']
export const CHEERS_END = ['今天也很棒，继续加油！', '有进步哦！', '练习完了，休息一下吧！']

let lastSpeakTs = 0

export function speak(text) {
  const s = getSettings()
  if (!s.sound || !s.voice) return
  // 语音至少间隔 2 秒，避免连播
  const now = Date.now()
  if (now - lastSpeakTs < 2000) return
  lastSpeakTs = now
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 1.05
    u.pitch = 1.2
    u.volume = 1
    window.speechSynthesis.speak(u)
  } catch (e) {}
}

export function cheerRight() {
  speak(CHEERS_RIGHT[Math.floor(Math.random() * CHEERS_RIGHT.length)])
}
