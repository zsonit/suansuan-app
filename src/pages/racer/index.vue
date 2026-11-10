<template>
  <view class="page">
    <view class="nav">
      <view class="close" @click="quit">✕</view>
      <view class="nav-mid">
        <text class="combo" v-if="combo >= 2">🔥 连击 ×{{ combo }}</text>
        <text class="combo dim" v-else>⏱️ 限时挑战</text>
      </view>
      <view class="close placeholder"></view>
    </view>

    <view class="clock" :class="{ danger: timeLeft <= 100 }">
      <text class="clock-num">{{ (timeLeft / 10).toFixed(1) }}</text>
      <text class="clock-unit">秒</text>
    </view>
    <view class="timebar">
      <view
        class="timebar-fill"
        :class="{ danger: timeLeft <= 100 }"
        :style="{ width: timePct + '%' }"
      ></view>
    </view>

    <view class="score-row">
      <text class="score ok">答对 {{ rightCount }}</text>
      <text class="score bad">答错 {{ wrongCount }}</text>
    </view>

    <view class="expr-card" :class="feedback">
      <text class="expr">{{ current.text }} =</text>
      <text class="fb up" v-if="feedback === 'right'">⏱️ +1 秒</text>
      <text class="fb down" v-else-if="feedback === 'wrong'">⏱️ -3 秒，正确是 {{ current.answer }}</text>
      <text class="fb dim" v-else>越答越快，连击越高越厉害！</text>
    </view>

    <view class="opts">
      <view
        v-for="(o, i) in options"
        :key="current.id + '-' + i"
        class="opt"
        :class="optClass(o)"
        @click="tap(o)"
      >
        {{ o }}
      </view>
    </view>

    <view class="bottom-space"></view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { generateForGame, makeChoices } from '@/common/questions'
import { getSettings, addWrong, addRecord, saveResult } from '@/common/store'

const TICK = 100
const START_MS = 600 // 60 秒（0.1s 单位）

const settings = ref(getSettings())
const list = ref([])
const idx = ref(0)
const options = ref([])
const feedback = ref('')
const chosen = ref('')
const timeLeft = ref(START_MS)
const combo = ref(0)
const bestCombo = ref(0)
const rightCount = ref(0)
const wrongCount = ref(0)
const wrongList = ref([])
const attempted = ref(0)
const cfg = ref({ difficulty: 1, grade: 0 })

let timer = null
let jump = null
let over = false

const total = computed(() => Math.max(attempted.value, 1))
const current = computed(() => list.value[idx.value] || { text: '', answer: 0, id: 0 })
const timePct = computed(() => Math.max(0, (timeLeft.value / START_MS) * 100))

onLoad((q) => {
  cfg.value = {
    difficulty: Number(q.difficulty || 1),
    grade: Number(q.grade || 0)
  }
  // 限时模式题目管够：边玩边发
  list.value = generateForGame({
    grade: cfg.value.grade,
    difficulty: cfg.value.difficulty,
    count: 60
  })
  if (!list.value.length) {
    uni.showToast({ title: '没有可练习的题目', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }
  setup()
  timer = setInterval(step, TICK)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (jump) clearTimeout(jump)
})

function buzz(long) {
  if (!settings.value.haptic) return
  try {
    long ? uni.vibrateLong() : uni.vibrateShort()
  } catch (e) {}
}

function step() {
  if (over) return
  if (timeLeft.value <= 0) {
    finish()
    return
  }
  timeLeft.value -= 1
}

function setup() {
  feedback.value = ''
  chosen.value = ''
  options.value = makeChoices(current.value, 4)
}

function optClass(o) {
  if (!feedback.value) return chosen.value === o ? 'picked' : ''
  if (o === String(current.value.answer)) return 'correct'
  if (o === chosen.value) return 'incorrect'
  return 'dim'
}

function tap(o) {
  if (feedback.value || over) return
  const q = current.value
  attempted.value++
  chosen.value = o
  if (o === String(q.answer)) {
    rightCount.value++
    combo.value++
    bestCombo.value = Math.max(bestCombo.value, combo.value)
    timeLeft.value = Math.min(START_MS, timeLeft.value + 10) // 答对 +1 秒
    feedback.value = 'right'
    buzz(false)
    jump = setTimeout(next, combo.value >= 5 ? 180 : 320)
  } else {
    wrongCount.value++
    combo.value = 0
    timeLeft.value = Math.max(0, timeLeft.value - 30) // 答错 -3 秒
    wrongList.value.push({ text: q.text, answer: q.answer, your: Number(o) || o })
    addWrong({ text: q.text, answer: q.answer, mode: q.mode })
    feedback.value = 'wrong'
    buzz(true)
    jump = setTimeout(next, 1100)
  }
}

function next() {
  jump = null
  if (idx.value + 1 >= list.value.length) {
    // 题目发完了就再来一批
    list.value = list.value.concat(
      generateForGame({ grade: cfg.value.grade, difficulty: cfg.value.difficulty, count: 40 })
    )
  }
  idx.value++
  setup()
}

function finish() {
  if (over) return
  over = true
  if (timer) clearInterval(timer)
  timer = null
  if (jump) clearTimeout(jump)
  const r = rightCount.value
  const w = wrongCount.value
  addRecord({
    mode: 'racer',
    total: r + w,
    right: r,
    durationMs: (START_MS / 10) * 1000,
    wrong: wrongList.value
  })
  saveResult({
    mode: 'racer',
    source: 'game',
    game: 'racer',
    total: r + w,
    right: r,
    durationMs: (START_MS / 10) * 1000,
    wrong: wrongList.value,
    difficulty: cfg.value.difficulty,
    count: r + w,
    grade: cfg.value.grade,
    bestCombo: bestCombo.value
  })
  uni.redirectTo({ url: '/pages/result/index' })
}

function quit() {
  if (attempted.value === 0) {
    uni.navigateBack()
    return
  }
  uni.showModal({
    title: '退出挑战？',
    content: '这一局的记录不会保存',
    confirmText: '退出',
    cancelText: '继续玩',
    success: (r) => {
      if (r.confirm) {
        over = true
        uni.navigateBack()
      }
    }
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-top: calc(var(--status-bar-height) + 16rpx);
  background: linear-gradient(180deg, #2d2a4a 0%, #454273 100%);
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
  color: #cfc9f2;
  background: rgba(255, 255, 255, 0.12);
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
.combo {
  font-size: 34rpx;
  font-weight: 800;
  color: #ffd166;
}
.combo.dim {
  color: #cfc9f2;
  font-size: 28rpx;
  letter-spacing: 4rpx;
}

.clock {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-top: 16rpx;
}
.clock-num {
  font-size: 110rpx;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.clock.danger .clock-num {
  color: #ff7b7b;
  animation: pulse 0.5s ease infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
.clock-unit {
  font-size: 30rpx;
  color: #cfc9f2;
  margin-left: 10rpx;
}
.timebar {
  margin: 10rpx 60rpx 0;
  height: 14rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 100rpx;
  overflow: hidden;
}
.timebar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6fd8a8, #2fbf87);
  border-radius: 100rpx;
  transition: width 0.1s linear;
}
.timebar-fill.danger {
  background: linear-gradient(90deg, #ff9a9a, #ff6b6b);
}

.score-row {
  display: flex;
  justify-content: center;
  margin-top: 18rpx;
}
.score {
  margin: 0 20rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #cfc9f2;
  background: rgba(255, 255, 255, 0.1);
  padding: 8rpx 24rpx;
  border-radius: 100rpx;
}

.expr-card {
  margin: 36rpx 60rpx 0;
  background: #fff;
  border-radius: 36rpx;
  padding: 40rpx 0 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.25);
  transition: border-color 0.2s;
  border: 4rpx solid #fff;
}
.expr-card.right {
  border-color: #2fbf87;
}
.expr-card.wrong {
  border-color: #ff6b6b;
}
.expr {
  font-size: 72rpx;
  font-weight: 800;
  color: #332c26;
}
.fb {
  margin-top: 10rpx;
  font-size: 26rpx;
  font-weight: 700;
}
.fb.up {
  color: #2fbf87;
}
.fb.down {
  color: #ff6b6b;
}
.fb.dim {
  color: #a79c92;
  font-weight: 500;
}

.opts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 44rpx;
  padding: 0 50rpx;
}
.opt {
  width: 44%;
  margin: 0 3% 28rpx;
  height: 130rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 30rpx;
  font-size: 52rpx;
  font-weight: 800;
  color: #454273;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.22);
  transition: all 0.15s;
}
.opt:active {
  transform: scale(0.96);
}
.opt.correct {
  background: #e8faf1;
  border: 4rpx solid #2fbf87;
  color: #1d9d6f;
  animation: popIn 0.3s ease;
}
.opt.incorrect {
  background: #fff2f2;
  border: 4rpx solid #ff6b6b;
  color: #e05252;
  animation: shake 0.4s ease;
}
.opt.dim {
  opacity: 0.4;
}
@keyframes popIn {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-12rpx); }
  50% { transform: translateX(12rpx); }
  75% { transform: translateX(-6rpx); }
}

.bottom-space {
  height: 60rpx;
}
</style>
