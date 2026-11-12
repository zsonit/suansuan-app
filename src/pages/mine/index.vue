<template>
  <view class="page" :class="{ eye: eyeCare }">
    <view class="nav">
      <text class="brand">我的</text>
    </view>

    <view class="profile" @click="editNick">
      <view class="avatar">🐣</view>
      <view class="profile-info">
        <view class="nick-row">
          <text class="nick">{{ nick }}</text>
          <text class="nick-edit">✏️</text>
        </view>
        <text class="nick-sub">在算算星球练习第 {{ days }} 天 · 点名字可以改</text>
        <text class="watch-line" @click.stop="goSettings">
          {{ watchOn ? `📺 今日已解锁 ${watchUsed} 分钟 · 还能看 ${watchLeft} 分钟` : '📺 先学再看未开启 · 点这里去开启' }}
        </text>
      </view>
    </view>

    <view class="grid">
      <view class="cell">
        <text class="cell-num">{{ stats.total }}</text>
        <text class="cell-label">累计题数</text>
      </view>
      <view class="cell">
        <text class="cell-num">{{ acc }}%</text>
        <text class="cell-label">总正确率</text>
      </view>
      <view class="cell">
        <text class="cell-num">{{ streak }}</text>
        <text class="cell-label">连续天数</text>
      </view>
      <view class="cell">
        <text class="cell-num">{{ wrongCount }}</text>
        <text class="cell-label">待攻克错题</text>
      </view>
    </view>

    <view class="today">
      <view class="today-head">
        <text class="today-title">今日进度</text>
        <text class="today-num">{{ today.n }} / {{ settings.dailyGoal }} 题</text>
      </view>
      <view class="bar">
        <view class="bar-fill" :style="{ width: goalPct + '%' }"></view>
      </view>
      <text class="today-tip">{{ goalTip }}</text>
    </view>

    <view class="menu">
      <view class="row" @click="goWrong">
        <text class="row-icon">📕</text>
        <text class="row-text">错题本</text>
        <text class="row-val">{{ wrongCount }} 题</text>
        <text class="row-chev">›</text>
      </view>
      <view class="row" @click="goSettings">
        <text class="row-icon">⚙️</text>
        <text class="row-text">练习设置</text>
        <text class="row-chev">›</text>
      </view>
      <view class="row" @click="about">
        <text class="row-icon">🌏</text>
        <text class="row-text">关于算算星球</text>
        <text class="row-chev">›</text>
      </view>
    </view>

    <text class="foot">数据只保存在这台设备上 · v1.0.0</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getStats, getToday, getStreak, getWrong, getSettings, saveSettings, getHistory, getWatchRules, getWatchUsed } from '@/common/store'

const stats = ref({ total: 0, right: 0, days: {} })
const today = ref({ n: 0, right: 0 })
const streak = ref(0)
const wrongCount = ref(0)
const settings = ref(getSettings())
const days = ref(0)

const acc = computed(() => {
  const t = stats.value.total
  if (!t) return 0
  return Math.round((stats.value.right / t) * 100)
})
const eyeCare = computed(() => settings.value.eyeCare)
const goalPct = computed(() =>
  Math.min(100, Math.round((today.value.n / (settings.value.dailyGoal || 20)) * 100))
)
const goalTip = computed(() => {
  const goal = settings.value.dailyGoal || 20
  const left = goal - today.value.n
  if (left > 0) return `还差 ${left} 题完成今天的小目标`
  return '今日目标已完成，真棒 🎉'
})
const nick = ref('小学员')

// 先学再看：今日已解锁 / 还能看（当前解锁剩余算在「还能看」里）
const watchOn = ref(false)
const watchUsed = ref(0)
const watchCap = ref(0)
const watchLeft = ref(0)

onShow(() => {
  stats.value = getStats()
  today.value = getToday()
  streak.value = getStreak()
  wrongCount.value = getWrong().length
  settings.value = getSettings()
  days.value = Object.keys(stats.value.days || {}).length
  nick.value = settings.value.nick || '小学员'
  const r = getWatchRules()
  watchOn.value = !!r.on
  watchCap.value = r.cap || 0
  watchUsed.value = getWatchUsed()
  watchLeft.value = Math.max(0, watchCap.value - watchUsed.value)
})

function editNick() {
  uni.showModal({
    title: '给自己起个名字',
    editable: true,
    placeholderText: '最多 12 个字，比如：小星星',
    content: nick.value === '小学员' ? '' : nick.value,
    confirmText: '保存',
    cancelText: '取消',
    success: (r) => {
      if (!r.confirm) return
      const v = (r.content || '').trim().slice(0, 12)
      if (!v) {
        uni.showToast({ title: '名字不能为空', icon: 'none' })
        return
      }
      nick.value = v
      saveSettings({ nick: v })
      uni.showToast({ title: '改好啦 🎉', icon: 'none' })
    }
  })
}

function goWrong() {
  uni.switchTab({ url: '/pages/wrong/index' })
}

function goSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function about() {
  const history = getHistory()
  uni.showModal({
    title: '算算星球',
    content: `儿童口算练习工具 v1.0.0\n\n出题、计时、判分、错题本全部在本机完成，不联网、不收集任何信息。\n\n已记录 ${history.length} 次练习。`,
    showCancel: false,
    confirmText: '知道了'
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-top: calc(max(env(safe-area-inset-top), var(--status-bar-height, 0px)) + 24rpx);
  padding-bottom: 60rpx;
  background: #fff9f0;
}
.page.eye {
  background: #ffeecb;
}
.nav {
  padding: 8rpx 40rpx 0;
}
.brand {
  font-size: 44rpx;
  font-weight: 800;
  color: #332c26;
}

.profile {
  margin: 32rpx 40rpx 0;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 36rpx;
  padding: 32rpx;
  box-shadow: 0 14rpx 34rpx rgba(180, 150, 120, 0.12);
}
.avatar {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: #fff3e4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 54rpx;
  margin-right: 26rpx;
}
.profile-info {
  display: flex;
  flex-direction: column;
}
.nick-row {
  display: flex;
  align-items: center;
}
.nick {
  font-size: 36rpx;
  font-weight: 800;
  color: #332c26;
}
.nick-edit {
  font-size: 24rpx;
  margin-left: 12rpx;
}
.nick-sub {
  margin-top: 10rpx;
  font-size: 23rpx;
  color: #a79c92;
}
.watch-line {
  margin-top: 10rpx;
  font-size: 23rpx;
  font-weight: 600;
  color: #2e8b57;
  background: #e8f7ee;
  border-radius: 100rpx;
  padding: 8rpx 20rpx;
  align-self: flex-start;
}

.grid {
  margin: 24rpx 40rpx 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.cell {
  width: 48%;
  box-sizing: border-box;
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx 0;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(180, 150, 120, 0.1);
}
.cell-num {
  font-size: 44rpx;
  font-weight: 800;
  color: #ff7a3d;
}
.cell-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #a79c92;
}

.today {
  margin: 8rpx 40rpx 0;
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(180, 150, 120, 0.1);
}
.today-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.today-title {
  font-size: 27rpx;
  font-weight: 700;
  color: #332c26;
}
.today-num {
  font-size: 23rpx;
  color: #a79c92;
}
.bar {
  margin-top: 18rpx;
  height: 14rpx;
  background: #f4ece2;
  border-radius: 100rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 100rpx;
  background: linear-gradient(90deg, #ffb27a, #ff7a3d);
}
.today-tip {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: #a79c92;
}

.menu {
  margin: 28rpx 40rpx 0;
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 28rpx rgba(180, 150, 120, 0.1);
}
.row {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 2rpx solid #f8f1e8;
}
.row:last-child {
  border-bottom: none;
}
.row-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
}
.row-text {
  flex: 1;
  font-size: 29rpx;
  color: #332c26;
  font-weight: 600;
}
.row-val {
  font-size: 24rpx;
  color: #a79c92;
  margin-right: 10rpx;
}
.row-chev {
  font-size: 38rpx;
  color: #d9c8b8;
}

.foot {
  display: block;
  text-align: center;
  margin-top: 40rpx;
  font-size: 21rpx;
  color: #c0b3a6;
}
</style>
