<template>
  <view class="page">
    <view class="nav">
      <view class="close" @click="quit">✕</view>
      <view class="nav-mid">
        <text class="progress-text">{{ done }} / {{ total }}</text>
        <text class="timer">{{ timeText }} · ⚖️ 天平砝码</text>
      </view>
      <view class="close placeholder"></view>
    </view>
    <view class="progress">
      <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
    </view>

    <view class="tip" :class="{ ok: feedback === 'right', bad: feedback === 'wrong' }">
      <text v-if="feedback === 'right'">平啦！两边一样重 🎉</text>
      <text v-else-if="feedback === 'wrong'">{{ heavy ? '哎呀，砝码太重啦 ⬇️' : '砝码太轻啦，翘不起来 ⬆️' }}</text>
      <text v-else>选一个砝码挂到右盘，让天平平衡</text>
    </view>

    <view class="scale-area">
      <view class="beam" :class="beamClass">
        <view class="pan left">
          <view class="pan-card left-card" :class="feedback">
            <text class="pan-expr">{{ current.text }}</text>
          </view>
          <view class="strings">
            <view class="str"></view>
            <view class="str"></view>
          </view>
        </view>
        <view class="fulcrum">
          <view class="pole"></view>
          <view class="base"></view>
        </view>
        <view class="pan right">
          <view class="strings">
            <view class="str"></view>
            <view class="str"></view>
          </view>
          <view class="pan-card right-card" :class="feedback">
            <text class="pan-expr" :class="{ placeholder: !chosen }">{{ chosen || '?' }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="weights">
      <view
        v-for="(w, i) in options"
        :key="current.id + '-w' + i"
        class="weight"
        :class="wClass(w)"
        @click="tap(w)"
      >
        <view class="w-top"></view>
        <view class="w-body">
          <text class="w-val">{{ w }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { generateForGame, makeChoices } from '@/common/questions'
import { getSettings, addWrong, addRecord, saveResult } from '@/common/store'
import { sfx, cheerRight } from '@/common/sound'

const settings = ref(getSettings())
const list = ref([])
const idx = ref(0)
const options = ref([])
const chosen = ref('')
const feedback = ref('')
const rightCount = ref(0)
const wrongList = ref([])
const elapsed = ref(0)
const cfg = ref({ difficulty: 1, count: 10, grade: 0 })

let tick = null
let jump = null
let firstWrong = ''

const total = computed(() => list.value.length)
const done = computed(() => idx.value + (feedback.value === 'right' ? 1 : 0))
const current = computed(() => list.value[idx.value] || { text: '', answer: 0 })
const progressPct = computed(() => (total.value ? (done.value / total.value) * 100 : 0))
const timeText = computed(() => {
  const s = elapsed.value
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})
const heavy = computed(() => {
  const n = Number(chosen.value)
  return Number.isFinite(n) && n > Number(current.value.answer)
})
const beamClass = computed(() => {
  if (feedback.value === 'right') return 'level'
  if (chosen.value === '') return 'left-heavy'
  return heavy.value ? 'right-heavy' : 'left-heavy'
})

onLoad((q) => {
  cfg.value = {
    difficulty: Number(q.difficulty || 1),
    count: Number(q.count || 10),
    grade: Number(q.grade || 0)
  }
  list.value = generateForGame({
    grade: cfg.value.grade,
    difficulty: cfg.value.difficulty,
    count: cfg.value.count
  })
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
  chosen.value = ''
  feedback.value = ''
  options.value = makeChoices(current.value, 4)
}

function wClass(w) {
  if (feedback.value === 'right' && chosen.value === w) return 'good'
  if (feedback.value === 'wrong' && chosen.value === w) return 'bad shake'
  if (feedback.value === 'right') return 'fade'
  if (chosen.value === w) return 'picked'
  return ''
}

function tap(w) {
  if (feedback.value === 'right') return
  const q = current.value
  chosen.value = w
  if (w === String(q.answer)) {
    feedback.value = 'right'
    buzz(false)
    sfx('match')
    if (Math.random() < 0.3) cheerRight()
    if (firstWrong) {
      wrongList.value.push({ text: q.text, answer: q.answer, your: firstWrong })
      addWrong({ text: q.text, answer: q.answer, mode: q.mode })
    } else {
      rightCount.value++
    }
    jump = setTimeout(next, 1000)
  } else {
    feedback.value = 'wrong'
    if (!firstWrong) firstWrong = w
    buzz(true)
    sfx('wrong')
    jump = setTimeout(() => {
      feedback.value = ''
      chosen.value = ''
      jump = null
    }, 1000)
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
    mode: 'balance',
    total: total.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value
  })
  saveResult({
    mode: 'balance',
    source: 'game',
    game: 'balance',
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
  padding-top: calc(var(--status-bar-height) + 16rpx);
  background: linear-gradient(180deg, #e8f6ee 0%, #fff9f0 100%);
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
  color: #7d8b99;
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

.tip {
  margin: 30rpx 60rpx 0;
  padding: 20rpx 0;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #6d6157;
  background: #fff;
  border-radius: 100rpx;
  box-shadow: 0 8rpx 20rpx rgba(120, 150, 120, 0.1);
}
.tip.ok {
  color: #1d9d6f;
  background: #e8faf1;
}
.tip.bad {
  color: #e05252;
  background: #fff2f2;
}

.scale-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 10rpx;
}
.beam {
  position: relative;
  width: 640rpx;
  height: 300rpx;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.beam.left-heavy {
  transform: rotate(-7deg);
}
.beam.right-heavy {
  transform: rotate(7deg);
}
.beam.level {
  transform: rotate(0deg);
}
.beam::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 145rpx;
  height: 12rpx;
  background: linear-gradient(90deg, #c78d5a, #a06b3c);
  border-radius: 100rpx;
}
.pan {
  position: absolute;
  top: 150rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 230rpx;
}
.pan.left {
  left: 0;
}
.pan.right {
  right: 0;
}
.strings {
  display: flex;
  justify-content: space-between;
  width: 160rpx;
  height: 34rpx;
}
.str {
  width: 4rpx;
  height: 34rpx;
  background: #a06b3c;
}
.pan-card {
  width: 210rpx;
  min-height: 110rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 4rpx solid #d8b28a;
  border-radius: 22rpx;
  box-shadow: 0 10rpx 22rpx rgba(160, 107, 60, 0.16);
  padding: 10rpx 8rpx;
}
.pan-card.right {
  border-style: dashed;
  background: #fffdf7;
}
.pan-expr {
  font-size: 44rpx;
  font-weight: 800;
  color: #332c26;
}
.pan-expr.placeholder {
  color: #c9bba9;
}
.pan-card.good {
  border-color: #2fbf87;
  background: #e8faf1;
}
.pan-card.bad {
  border-color: #ff6b6b;
  background: #fff2f2;
}
.fulcrum {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 155rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pole {
  width: 16rpx;
  height: 90rpx;
  background: #a06b3c;
  border-radius: 8rpx;
}
.base {
  width: 150rpx;
  height: 22rpx;
  background: #8a5a30;
  border-radius: 12rpx;
}

.weights {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 30rpx calc(40rpx + env(safe-area-inset-bottom));
}
.weight {
  width: 24%;
  margin: 0 4% 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.15s;
}
.weight:active {
  transform: scale(0.93);
}
.w-top {
  width: 64rpx;
  height: 14rpx;
  background: #b7a98f;
  border-radius: 8rpx 8rpx 0 0;
}
.w-body {
  width: 130rpx;
  height: 110rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #cfc4ae, #b7a98f);
  border-radius: 10rpx 10rpx 18rpx 18rpx;
  box-shadow: 0 10rpx 20rpx rgba(140, 120, 90, 0.25);
}
.w-val {
  font-size: 44rpx;
  font-weight: 800;
  color: #4a4136;
}
.weight.picked .w-body {
  background: linear-gradient(180deg, #ffd9b8, #ffb27a);
  box-shadow: 0 12rpx 24rpx rgba(255, 122, 61, 0.35);
}
.weight.good .w-body {
  background: linear-gradient(180deg, #7fe0b6, #2fbf87);
}
.weight.good .w-val {
  color: #fff;
}
.weight.bad .w-body {
  background: linear-gradient(180deg, #ff9a9a, #ff6b6b);
}
.weight.bad .w-val {
  color: #fff;
}
.weight.bad.shake {
  animation: shake 0.4s ease;
}
.weight.fade {
  opacity: 0.35;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-12rpx); }
  50% { transform: translateX(12rpx); }
  75% { transform: translateX(-6rpx); }
}
</style>
