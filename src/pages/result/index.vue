<template>
  <view class="page" :class="{ eye: settings.eyeCare }">
    <view class="nav">
      <text class="nav-title">练习结果</text>
    </view>

    <view class="head" :class="grade.cls">
      <view class="circle">
        <text class="pct">{{ acc }}<text class="pct-sym">%</text></text>
        <text class="circle-label">正确率</text>
      </view>
      <text class="grade-text">{{ grade.text }}</text>
    </view>

    <view class="stats">
      <view class="stat">
        <text class="stat-num ok">{{ res.right || 0 }}</text>
        <text class="stat-label">答对</text>
      </view>
      <view class="stat mid">
        <text class="stat-num bad">{{ (res.total || 0) - (res.right || 0) }}</text>
        <text class="stat-label">答错</text>
      </view>
      <view class="stat">
        <text class="stat-num">{{ duration }}</text>
        <text class="stat-label">用时</text>
      </view>
    </view>

    <view class="avg" v-if="avgSpeed">
      <text class="avg-text">平均每题 {{ avgSpeed }} 秒</text>
    </view>

    <view class="wrong-box" v-if="wrongs.length">
      <view class="wrong-head">
        <text class="wrong-title">这一组错题（{{ wrongs.length }}）</text>
        <text class="wrong-tip">已自动收进错题本</text>
      </view>
      <view class="wrong-item" v-for="(w, i) in wrongs" :key="i">
        <text class="w-expr">{{ exprText(w) }}</text>
        <text class="w-your">你写的 {{ w.your }}</text>
      </view>
    </view>

    <view class="actions">
      <view class="btn primary" @click="again">再做一组</view>
      <view class="btn ghost" @click="goWrong" v-if="wrongs.length">看看错题本</view>
      <view class="btn ghost" @click="goHome">回首页</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { takeResult, getSettings } from '@/common/store'
import { fmtDuration, exprText } from '@/common/questions'

const settings = ref(getSettings())
const res = ref({ total: 0, right: 0, durationMs: 0, wrong: [], mode: 'add', difficulty: 1, count: 10 })
const wrongs = computed(() => res.value.wrong || [])

const acc = computed(() => {
  const t = res.value.total || 0
  if (!t) return 0
  return Math.round(((res.value.right || 0) / t) * 100)
})

const duration = computed(() => fmtDuration(res.value.durationMs))

const avgSpeed = computed(() => {
  const n = res.value.total || 0
  if (!n) return ''
  return ((res.value.durationMs || 0) / 1000 / n).toFixed(1)
})

const grade = computed(() => {
  const a = acc.value
  if (a === 100) return { text: '满分！太厉害了 🎉', cls: 'g-a' }
  if (a >= 90) return { text: '非常棒，继续保持 💪', cls: 'g-a' }
  if (a >= 70) return { text: '不错，再练一轮更稳 👍', cls: 'g-b' }
  if (a >= 50) return { text: '有进步空间，慢慢来 🙂', cls: 'g-c' }
  return { text: '别急，先把错题过一遍 🌱', cls: 'g-c' }
})

onLoad(() => {
  settings.value = getSettings()
  const r = takeResult()
  if (r) res.value = Object.assign(res.value, r)
})

function again() {
  const r = res.value
  if (r.source === 'wrong') {
    uni.redirectTo({ url: '/pages/practice/index?source=wrong&count=10' })
    return
  }
  if (r.source === 'game' && r.game) {
    uni.redirectTo({
      url: `/pages/${r.game}/index?difficulty=${r.difficulty || 1}&count=${r.count || 10}&grade=${r.grade || 0}`
    })
    return
  }
  if (r.source === 'grade' && r.grade) {
    uni.redirectTo({
      url: `/pages/practice/index?source=grade&grade=${r.grade}&count=${r.count || 10}`
    })
    return
  }
  uni.redirectTo({
    url: `/pages/practice/index?mode=${r.mode}&difficulty=${r.difficulty || 1}&count=${r.count || 10}`
  })
}

function goWrong() {
  uni.switchTab({ url: '/pages/wrong/index' })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-top: calc(var(--status-bar-height) + 16rpx);
  padding-bottom: 60rpx;
  background: #fff9f0;
}
.page.eye {
  background: #ffeecb;
}
.nav {
  padding: 12rpx 40rpx 0;
}
.nav-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #332c26;
}

.head {
  margin: 20rpx 40rpx 0;
  background: #fff;
  border-radius: 40rpx;
  padding: 46rpx 0 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 18rpx 42rpx rgba(180, 150, 120, 0.14);
}
.circle {
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  border: 14rpx solid #ffe2cd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.g-a .circle {
  border-color: #2fbf87;
}
.g-b .circle {
  border-color: #ffb27a;
}
.g-c .circle {
  border-color: #ff9f9f;
}
.pct {
  font-size: 82rpx;
  font-weight: 800;
  color: #332c26;
  line-height: 1;
}
.pct-sym {
  font-size: 34rpx;
  font-weight: 700;
  color: #a79c92;
}
.circle-label {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #a79c92;
}
.grade-text {
  margin-top: 28rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #4c433b;
}

.stats {
  margin: 28rpx 40rpx 0;
  display: flex;
  background: #fff;
  border-radius: 32rpx;
  padding: 30rpx 0;
  box-shadow: 0 10rpx 28rpx rgba(180, 150, 120, 0.1);
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat.mid {
  border-left: 2rpx solid #f4ece2;
  border-right: 2rpx solid #f4ece2;
}
.stat-num {
  font-size: 44rpx;
  font-weight: 800;
  color: #332c26;
}
.stat-num.ok {
  color: #2fbf87;
}
.stat-num.bad {
  color: #ff6b6b;
}
.stat-label {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #a79c92;
}

.avg {
  margin: 18rpx 40rpx 0;
  text-align: center;
}
.avg-text {
  font-size: 24rpx;
  color: #a79c92;
}

.wrong-box {
  margin: 30rpx 40rpx 0;
  background: #fff;
  border-radius: 32rpx;
  padding: 28rpx 30rpx;
  box-shadow: 0 10rpx 28rpx rgba(180, 150, 120, 0.1);
}
.wrong-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.wrong-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #332c26;
}
.wrong-tip {
  font-size: 21rpx;
  color: #c0b3a6;
}
.wrong-item {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 18rpx;
  border-bottom: 2rpx solid #f8f1e8;
}
.wrong-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.w-expr {
  font-size: 30rpx;
  font-weight: 700;
  color: #332c26;
}
.w-your {
  font-size: 23rpx;
  color: #ff6b6b;
}

.actions {
  margin: 40rpx 40rpx 0;
}
.btn {
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  border-radius: 30rpx;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
}
.btn.primary {
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
  box-shadow: 0 16rpx 32rpx rgba(255, 122, 61, 0.3);
}
.btn.ghost {
  background: #fff;
  color: #6d6157;
  box-shadow: 0 8rpx 22rpx rgba(180, 150, 120, 0.1);
}
</style>
