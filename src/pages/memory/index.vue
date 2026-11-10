<template>
  <view class="page">
    <view class="nav">
      <view class="close" @click="quit">✕</view>
      <view class="nav-mid">
        <text class="progress-text">配对 {{ matchedPairs }} / {{ totalPairs }}</text>
        <text class="timer">{{ timeText }} · 🧠 翻牌记忆</text>
      </view>
      <view class="close placeholder"></view>
    </view>
    <view class="progress">
      <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
    </view>

    <view class="grid">
      <view
        v-for="c in cards"
        :key="c.key"
        class="card"
        :class="[c.kind, { open: c.open, matched: c.matched, shake: shakes.includes(c.key) }]"
        @click="flip(c)"
      >
        <view class="inner" :class="{ flipped: c.open || c.matched }">
          <view class="face back"><text class="back-icon">?</text></view>
          <view class="face front" :class="c.kind">
            <text class="face-text" :class="{ small: c.label.length > 6 }">{{ c.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="hint">
      <text class="hint-text" v-if="matchedPairs < totalPairs">翻出两张牌：算式 ➕ 它的答案 🧠</text>
      <text class="hint-text done" v-else>全部配对完成！🎉</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { generateForGame } from '@/common/questions'
import { getSettings, addWrong, addRecord, saveResult } from '@/common/store'
import { sfx } from '@/common/sound'

const settings = ref(getSettings())
const cards = ref([])
const matchedPairs = ref(0)
const totalPairs = ref(0)
const rightCount = ref(0)
const wrongList = ref([])
const elapsed = ref(0)
const shakes = ref([])
const locked = ref(false)
const cfg = ref({ difficulty: 1, count: 6, grade: 0 })

let tick = null
let resolveTimer = null
let shakeTimer = null
// 每对题的出错情况：qid -> { q, wrong, firstWrong }
const attempt = ref({})

const PAIRS = 6
const progressPct = computed(() =>
  totalPairs.value ? (matchedPairs.value / totalPairs.value) * 100 : 0
)
const timeText = computed(() => {
  const s = elapsed.value
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})

onLoad((q) => {
  cfg.value = {
    difficulty: Number(q.difficulty || 1),
    count: Number(q.count || PAIRS),
    grade: Number(q.grade || 0)
  }
  build()
  tick = setInterval(() => elapsed.value++, 1000)
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
  if (resolveTimer) clearTimeout(resolveTimer)
  if (shakeTimer) clearTimeout(shakeTimer)
})

function buzz(long) {
  if (!settings.value.haptic) return
  try {
    long ? uni.vibrateLong() : uni.vibrateShort()
  } catch (e) {}
}

function shuffled(a) {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = r[i]
    r[i] = r[j]
    r[j] = t
  }
  return r
}

function build() {
  // 取答案互不相同的题，避免翻牌歧义
  const pool = generateForGame({ grade: cfg.value.grade, difficulty: cfg.value.difficulty, count: 30 })
  const uniq = []
  const seenAns = new Set()
  for (const q of pool) {
    if (seenAns.has(String(q.answer))) continue
    seenAns.add(String(q.answer))
    uniq.push(q)
    if (uniq.length >= PAIRS) break
  }
  totalPairs.value = uniq.length
  matchedPairs.value = 0
  attempt.value = {}
  rightCount.value = 0
  wrongList.value = []
  const mk = []
  uniq.forEach((q, i) => {
    mk.push({ key: `e${i}`, qid: i, q, kind: 'expr', label: q.text + ' =', open: false, matched: false })
    mk.push({ key: `a${i}`, qid: i, q, kind: 'ans', label: String(q.answer), open: false, matched: false })
  })
  cards.value = shuffled(mk)
}

function openCount() {
  return cards.value.filter((c) => c.open && !c.matched).length
}

function flip(c) {
  if (locked.value || c.matched || c.open) return
  c.open = true
  buzz(false)
  sfx('flip')
  if (openCount() < 2) return

  // 两张翻开，判定
  const [a, b] = cards.value.filter((x) => x.open && !x.matched)
  locked.value = true
  if (a.qid === b.qid && a.kind !== b.kind) {
    // 配对成功
    a.matched = true
    b.matched = true
    matchedPairs.value++
    sfx('match')
    const rec = attempt.value[a.qid] || { q: a.q, wrong: 0, firstWrong: '' }
    if (rec.wrong === 0) rightCount.value++
    else {
      wrongList.value.push({ text: rec.q.text, answer: rec.q.answer, your: rec.firstWrong })
      addWrong({ text: rec.q.text, answer: rec.q.answer, mode: rec.q.mode })
    }
    resolveTimer = setTimeout(() => {
      locked.value = false
      if (matchedPairs.value >= totalPairs.value) setTimeout(finish, 700)
    }, 450)
  } else {
    // 配对失败：记到算式那张牌头上
    const exprCard = a.kind === 'expr' ? a : b
    const rec = attempt.value[exprCard.qid] || { q: exprCard.q, wrong: 0, firstWrong: '' }
    rec.wrong++
    if (!rec.firstWrong) {
      const other = a.kind === 'expr' ? b : a
      rec.firstWrong = other.label
    }
    attempt.value[exprCard.qid] = rec
    buzz(true)
    sfx('wrong')
    shakes.value = [a.key, b.key]
    shakeTimer = setTimeout(() => {
      shakes.value = []
    }, 420)
    resolveTimer = setTimeout(() => {
      a.open = false
      b.open = false
      locked.value = false
    }, 800)
  }
}

function finish() {
  if (tick) clearInterval(tick)
  tick = null
  addRecord({
    mode: 'memory',
    total: totalPairs.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value
  })
  saveResult({
    mode: 'memory',
    source: 'game',
    game: 'memory',
    total: totalPairs.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value,
    difficulty: cfg.value.difficulty,
    count: totalPairs.value,
    grade: cfg.value.grade
  })
  uni.redirectTo({ url: '/pages/result/index' })
}

function quit() {
  if (matchedPairs.value === 0) {
    uni.navigateBack()
    return
  }
  uni.showModal({
    title: '退出游戏？',
    content: '这一局的记录不会保存',
    confirmText: '退出',
    cancelText: '继续玩',
    success: (r) => {
      if (r.confirm) uni.navigateBack()
    }
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-top: calc(var(--status-bar-height) + 16rpx);
  background: linear-gradient(180deg, #f3edff 0%, #fff9f0 100%);
  display: flex;
  flex-direction: column;
}
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 36rpx;
}
.close {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  font-size: 32rpx;
  color: #8e8176;
  background: #fff;
  border-radius: 50%;
}
.close.placeholder {
  background: transparent;
}
.nav-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.progress-text {
  font-size: 32rpx;
  font-weight: 800;
  color: #332c26;
}
.timer {
  font-size: 22rpx;
  color: #8b7fa8;
  margin-top: 2rpx;
}
.progress {
  margin: 18rpx 36rpx 0;
  height: 12rpx;
  background: #e9e2f5;
  border-radius: 100rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #b39dff, #8e6bff);
  border-radius: 100rpx;
  transition: width 0.3s ease;
}

.grid {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  padding: 20rpx 36rpx;
}
.card {
  width: 30%;
  margin: 0 1.66% 24rpx;
  height: 160rpx;
  perspective: 600rpx;
}
.inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.35s;
  transform-style: preserve-3d;
}
.inner.flipped {
  transform: rotateY(180deg);
}
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.face.back {
  background: linear-gradient(145deg, #8e6bff, #6a4de0);
  box-shadow: 0 10rpx 22rpx rgba(110, 80, 220, 0.3);
}
.back-icon {
  font-size: 60rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}
.face.front {
  transform: rotateY(180deg);
  background: #fff;
  border: 4rpx solid #fff;
  box-shadow: 0 8rpx 20rpx rgba(120, 100, 180, 0.15);
  padding: 8rpx;
}
.face.front.expr {
  border-color: #d9ccff;
}
.face-text {
  font-size: 36rpx;
  font-weight: 800;
  color: #332c26;
}
.face-text.small {
  font-size: 28rpx;
}
.card.matched .face.front {
  background: #e8faf1;
  border-color: #2fbf87;
}
.card.matched .face-text {
  color: #1d9d6f;
}
.card.matched {
  animation: settle 0.4s ease;
}
@keyframes settle {
  0% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
.card.shake {
  animation: shake 0.4s ease;
}
.card.shake .face.front {
  border-color: #ff6b6b;
  background: #fff2f2;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10rpx); }
  50% { transform: translateX(10rpx); }
  75% { transform: translateX(-5rpx); }
}

.hint {
  padding: 16rpx 0 calc(36rpx + env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
}
.hint-text {
  font-size: 24rpx;
  color: #8b7fa8;
}
.hint-text.done {
  color: #2fbf87;
  font-weight: 700;
}
</style>
