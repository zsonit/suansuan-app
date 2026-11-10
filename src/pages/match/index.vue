<template>
  <view class="page">
    <view class="nav">
      <view class="close" @click="quit">✕</view>
      <view class="nav-mid">
        <text class="progress-text">第 {{ roundNo }} / {{ rounds }} 关</text>
        <text class="timer">{{ timeText }} · 配对 {{ matchedPairs }}/{{ totalPairs }}</text>
      </view>
      <view class="close placeholder"></view>
    </view>
    <view class="progress">
      <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
    </view>

    <view class="board">
      <view class="col">
        <view
          v-for="it in leftItems"
          :key="'L' + it.key"
          class="cell expr-cell"
          :class="{ sel: selLeft === it.key, matched: it.matched, shake: shakeL === it.key }"
          @click="tapLeft(it)"
        >
          {{ it.text }} =
        </view>
      </view>
      <view class="col">
        <view
          v-for="it in rightItems"
          :key="'R' + it.key"
          class="cell ans-cell"
          :class="{ sel: selRight === it.key, matched: it.matched, shake: shakeR === it.key }"
          @click="tapRight(it)"
        >
          {{ it.label }}
        </view>
      </view>
    </view>

    <view class="hint" v-if="!allDone">
      <text class="hint-text">先点一个算式，再点它的答案 🃏</text>
    </view>
    <view class="hint" v-else>
      <text class="hint-text done">全部配对完成！🎉</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { generateForGame } from '@/common/questions'
import { getSettings, addWrong, addRecord, saveResult } from '@/common/store'

const settings = ref(getSettings())
const questions = ref([])
const roundNo = ref(1)
const rounds = ref(1)
const leftItems = ref([])
const rightItems = ref([])
const selLeft = ref(null)
const selRight = ref(null)
const shakeL = ref(null)
const shakeR = ref(null)
const rightCount = ref(0)
const wrongList = ref([])
const matchedPairs = ref(0)
const totalPairs = ref(0)
const elapsed = ref(0)
const cfg = ref({ difficulty: 1, count: 10, grade: 0 })

let tick = null
let shakeTimer = null
// 每道题的尝试记录：是否一次配对成功
const attempt = ref({}) // key -> { q, wrong: 0 }

const PER = 4
const allDone = computed(() => matchedPairs.value >= totalPairs.value)
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
    count: Number(q.count || 10),
    grade: Number(q.grade || 0)
  }
  const n = Math.max(PER, cfg.value.count)
  questions.value = generateForGame({ grade: cfg.value.grade, difficulty: cfg.value.difficulty, count: n })
  if (questions.value.length < 2) {
    uni.showToast({ title: '没有可练习的题目', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }
  rounds.value = Math.ceil(questions.value.length / PER)
  totalPairs.value = questions.value.length
  startRound()
  tick = setInterval(() => elapsed.value++, 1000)
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
  if (shakeTimer) clearTimeout(shakeTimer)
})

function buzz(long) {
  if (!settings.value.haptic) return
  try {
    long ? uni.vibrateLong() : uni.vibrateShort()
  } catch (e) {}
}

function shuffled(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

function startRound() {
  selLeft.value = null
  selRight.value = null
  const chunk = questions.value.slice((roundNo.value - 1) * PER, roundNo.value * PER)
  leftItems.value = chunk.map((q, i) => ({
    key: `r${roundNo.value}q${i}`,
    text: q.text,
    q,
    matched: false
  }))
  rightItems.value = shuffled(chunk).map((q, i) => ({
    key: `r${roundNo.value}a${i}`,
    label: String(q.answer),
    q,
    matched: false
  }))
}

function tapLeft(it) {
  if (it.matched) return
  selLeft.value = it.key
  if (selRight.value !== null) tryMatch()
}

function tapRight(it) {
  if (it.matched) return
  selRight.value = it.key
  if (selLeft.value !== null) tryMatch()
}

function tryMatch() {
  const L = leftItems.value.find((x) => x.key === selLeft.value)
  const R = rightItems.value.find((x) => x.key === selRight.value)
  if (!L || !R) return
  const rec = attempt.value[L.key] || { q: L.q, wrong: 0 }
  attempt.value[L.key] = rec

  if (String(L.q.answer) === R.label) {
    // 配对成功
    L.matched = true
    R.matched = true
    matchedPairs.value++
    buzz(false)
    if (rec.wrong === 0) rightCount.value++
    else {
      wrongList.value.push({ text: L.q.text, answer: L.q.answer, your: rec.firstWrong || '' })
      addWrong({ text: L.q.text, answer: L.q.answer, mode: L.q.mode })
    }
    selLeft.value = null
    selRight.value = null
    if (matchedPairs.value >= totalPairs.value) {
      setTimeout(finish, 900)
    } else if (leftItems.value.every((x) => x.matched)) {
      setTimeout(() => {
        roundNo.value++
        startRound()
      }, 650)
    }
  } else {
    // 配对失败
    rec.wrong++
    if (!rec.firstWrong) rec.firstWrong = R.label
    buzz(true)
    shakeL.value = L.key
    shakeR.value = R.key
    selLeft.value = null
    selRight.value = null
    if (shakeTimer) clearTimeout(shakeTimer)
    shakeTimer = setTimeout(() => {
      shakeL.value = null
      shakeR.value = null
    }, 450)
  }
}

function finish() {
  if (tick) clearInterval(tick)
  tick = null
  addRecord({
    mode: 'match',
    total: totalPairs.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value
  })
  saveResult({
    mode: 'match',
    source: 'game',
    game: 'match',
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
  background: #fff9f0;
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
  color: #a79c92;
  margin-top: 2rpx;
}
.progress {
  margin: 18rpx 36rpx 0;
  height: 12rpx;
  background: #f2e7db;
  border-radius: 100rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb27a, #ff7a3d);
  border-radius: 100rpx;
  transition: width 0.3s ease;
}

.board {
  flex: 1;
  display: flex;
  padding: 40rpx 40rpx 0;
}
.col {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.col:first-child {
  margin-right: 60rpx;
}
.cell {
  margin-bottom: 26rpx;
  height: 110rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 26rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #332c26;
  background: #fff;
  border: 4rpx solid #fff;
  box-shadow: 0 8rpx 20rpx rgba(180, 150, 120, 0.12);
  transition: all 0.15s;
}
.ans-cell {
  margin-left: 20rpx;
}
.cell.sel {
  border-color: #ff7a3d;
  background: #fff6ee;
  transform: scale(1.03);
}
.cell.matched {
  background: #e8faf1;
  border-color: #2fbf87;
  color: #1d9d6f;
  opacity: 0.85;
  transform: scale(0.98);
}
.cell.shake {
  animation: shake 0.4s ease;
  border-color: #ff6b6b;
  background: #fff2f2;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-12rpx); }
  50% { transform: translateX(12rpx); }
  75% { transform: translateX(-6rpx); }
}

.hint {
  padding: 20rpx 0 calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
}
.hint-text {
  font-size: 24rpx;
  color: #a79c92;
}
.hint-text.done {
  color: #2fbf87;
  font-weight: 700;
}
</style>
