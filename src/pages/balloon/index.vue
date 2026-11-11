<template>
  <view class="page">
    <view class="nav">
      <view class="close" @click="quit">✕</view>
      <view class="nav-mid">
        <text class="progress-text">{{ done }} / {{ total }}</text>
        <text class="timer">{{ timeText }}</text>
      </view>
      <view class="close placeholder"></view>
    </view>
    <view class="progress">
      <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
    </view>

    <view class="expr-card" :class="feedback">
      <text class="expr">{{ exprOf(current.text) }}</text>
      <text class="tip" v-if="feedback === 'right'">砰！答对啦 🎉</text>
      <text class="tip bad" v-if="feedback === 'wrong'">正确答案是 {{ current.answer }}</text>
      <text class="tip" v-else-if="!feedback">点爆装着正确答案的气球！</text>
    </view>

    <view class="sky">
      <view
        v-for="(b, i) in balloons"
        :key="current.id + '-' + i"
        class="slot"
        :style="SLOTS[i]"
      >
        <view
          class="balloon"
          :class="[b.color, b.state]"
          @click="tap(i)"
        >
          <view class="b-body">
            <text class="b-num">{{ b.label }}</text>
          </view>
          <view class="b-knot"></view>
          <view class="b-string"></view>
          <text class="b-boom" v-if="b.state === 'popped'">💥</text>
        </view>
      </view>
      <view class="ground"></view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { generateForGame, makeChoices } from '@/common/questions'
import { getSettings, addWrong, addRecord, saveResult } from '@/common/store'
import { sfx, cheerRight } from '@/common/sound'

const SLOTS = [
  { left: '6%', top: '8%' },
  { left: '56%', top: '2%' },
  { left: '30%', top: '44%' },
  { left: '76%', top: '50%' }
]
const COLORS = ['c-red', 'c-blue', 'c-yellow', 'c-green']

const settings = ref(getSettings())
// 题干自带 = 或 ○ 时不再追加等号
function exprOf(t) {
  return /[=○]/.test(t) ? t : t + ' ='
}
const list = ref([])
const idx = ref(0)
const balloons = ref([])
const rightCount = ref(0)
const wrongList = ref([])
const feedback = ref('')
const elapsed = ref(0)
const cfg = ref({ difficulty: 1, count: 10, grade: 0 })

let tick = null
let jump = null
let firstWrong = ''

const total = computed(() => list.value.length)
const done = computed(() => idx.value + (feedback.value ? 1 : 0))
const current = computed(() => list.value[idx.value] || { text: '', answer: 0 })
const progressPct = computed(() => (total.value ? (done.value / total.value) * 100 : 0))
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
  list.value = generateForGame({ grade: cfg.value.grade, difficulty: cfg.value.difficulty, count: cfg.value.count })
  if (!list.value.length) {
    uni.showToast({ title: '没有可练习的题目', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }
  setup()
  tick = setInterval(() => elapsed.value++, 1000)
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
  if (jump) clearTimeout(jump)
})

function buzz(long) {
  if (!settings.value.haptic) return
  try {
    long ? uni.vibrateLong() : uni.vibrateShort()
  } catch (e) {}
}

function setup() {
  firstWrong = ''
  feedback.value = ''
  const q = current.value
  const opts = makeChoices(q, 4)
  balloons.value = opts.map((label, i) => ({
    label,
    state: 'idle',
    correct: label === String(q.answer),
    color: COLORS[i]
  }))
}

function tap(i) {
  if (feedback.value) return
  const b = balloons.value[i]
  if (!b || b.state !== 'idle') return
  if (b.correct) {
    b.state = 'popped'
    buzz(false)
    sfx('pop')
    if (Math.random() < 0.3) cheerRight()
    if (firstWrong) {
      wrongList.value.push({ text: current.value.text, answer: current.value.answer, your: firstWrong })
      addWrong({ text: current.value.text, answer: current.value.answer, mode: current.value.mode })
    } else {
      rightCount.value++
    }
    feedback.value = 'right'
    jump = setTimeout(next, 750)
  } else {
    b.state = 'wrong'
    if (!firstWrong) firstWrong = b.label
    buzz(true)
    sfx('wrong')
  }
}

function next() {
  jump = null
  if (idx.value + 1 >= list.value.length) finish()
  else {
    idx.value++
    setup()
  }
}

function finish() {
  if (tick) clearInterval(tick)
  tick = null
  addRecord({
    mode: 'balloon',
    total: total.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value
  })
  saveResult({
    mode: 'balloon',
    source: 'game',
    game: 'balloon',
    total: total.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value,
    difficulty: cfg.value.difficulty,
    count: cfg.value.count,
    grade: cfg.value.grade
  })
  uni.redirectTo({ url: '/pages/result/index' })
}

function quit() {
  if (idx.value === 0 && !firstWrong) {
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
  padding-top: calc(max(env(safe-area-inset-top), var(--status-bar-height, 0px)) + 16rpx);
  background: linear-gradient(180deg, #bfe3ff 0%, #e3f2ff 55%, #fff9f0 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  color: #7d8b99;
  margin-top: 2rpx;
}
.progress {
  margin: 18rpx 36rpx 0;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 100rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb27a, #ff7a3d);
  border-radius: 100rpx;
  transition: width 0.3s ease;
}

.expr-card {
  margin: 30rpx 60rpx 0;
  background: #fff;
  border-radius: 36rpx;
  padding: 34rpx 0 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16rpx 36rpx rgba(90, 130, 170, 0.16);
  border: 4rpx solid #fff;
  transition: border-color 0.2s;
}
.expr-card.right {
  border-color: #2fbf87;
}
.expr-card.wrong {
  border-color: #ff6b6b;
}
.expr {
  font-size: 68rpx;
  font-weight: 800;
  color: #332c26;
}
.tip {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #2fbf87;
  font-weight: 600;
}
.tip.bad {
  color: #ff6b6b;
}

.sky {
  position: relative;
  flex: 1;
}
.ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 10rpx;
  background: rgba(255, 122, 61, 0.25);
  border-radius: 100rpx;
  margin: 0 60rpx;
}
.slot {
  position: absolute;
  width: 190rpx;
}
.balloon {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: bob 3.2s ease-in-out infinite;
}
.slot:nth-child(2) .balloon {
  animation-duration: 3.8s;
  animation-delay: 0.4s;
}
.slot:nth-child(3) .balloon {
  animation-duration: 2.9s;
  animation-delay: 0.9s;
}
.slot:nth-child(4) .balloon {
  animation-duration: 3.5s;
  animation-delay: 1.3s;
}
@keyframes bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-26rpx) rotate(2deg); }
}
.b-body {
  width: 170rpx;
  height: 204rpx;
  border-radius: 50% 50% 48% 48% / 56% 56% 44% 44%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset -14rpx -18rpx 0 rgba(0, 0, 0, 0.08), 0 14rpx 28rpx rgba(90, 130, 170, 0.2);
}
.c-red .b-body {
  background: #ff7b7b;
}
.c-blue .b-body {
  background: #6fb6ff;
}
.c-yellow .b-body {
  background: #ffd166;
}
.c-green .b-body {
  background: #6fd8a8;
}
.b-num {
  font-size: 52rpx;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
}
.b-knot {
  width: 20rpx;
  height: 18rpx;
  margin-top: -4rpx;
  background: inherit;
  clip-path: polygon(50% 0, 0 100%, 100% 100%);
}
.c-red .b-knot { background: #ff7b7b; }
.c-blue .b-knot { background: #6fb6ff; }
.c-yellow .b-knot { background: #ffd166; }
.c-green .b-knot { background: #6fd8a8; }
.b-string {
  width: 4rpx;
  height: 56rpx;
  background: rgba(120, 120, 130, 0.4);
  border-radius: 4rpx;
}
.balloon.idle:active {
  transform: scale(0.94);
}
.balloon.popped {
  animation: none;
}
.balloon.popped .b-body {
  animation: pop 0.4s ease forwards;
}
@keyframes pop {
  0% { transform: scale(1); opacity: 1; }
  60% { transform: scale(1.25); opacity: 0.9; }
  100% { transform: scale(0.1); opacity: 0; }
}
.b-boom {
  position: absolute;
  top: 40rpx;
  font-size: 80rpx;
  animation: boomIn 0.35s ease;
}
@keyframes boomIn {
  0% { transform: scale(0.4); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.balloon.wrong {
  animation: shake 0.4s ease;
}
.balloon.wrong .b-body {
  background: #cfcac3 !important;
  opacity: 0.75;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-14rpx); }
  50% { transform: translateX(14rpx); }
  75% { transform: translateX(-8rpx); }
}
</style>
