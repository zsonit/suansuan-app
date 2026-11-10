<template>
  <view class="page" :class="{ eye: eyeCare }">
    <view class="nav">
      <view class="back" @click="back">‹</view>
      <text class="nav-title">练习设置</text>
      <view class="back placeholder"></view>
    </view>

    <view class="group">
      <view class="group-title">每日目标</view>
      <view class="pills">
        <view
          v-for="g in goals"
          :key="g"
          class="pill"
          :class="{ active: settings.dailyGoal === g }"
          @click="setGoal(g)"
        >
          {{ g }} 题
        </view>
      </view>
      <text class="hint">完成目标后，首页会显示进度条满格</text>
    </view>

    <view class="group">
      <view class="row">
        <view class="row-main">
          <text class="row-title">答对后自动下一题</text>
          <text class="row-desc">关闭后需要手动点「继续」</text>
        </view>
        <switch :checked="settings.autoNext" color="#FF7A3D" @change="onAutoNext" />
      </view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">答错震动提醒</text>
          <text class="row-desc">手机端生效，网页端无反馈</text>
        </view>
        <switch :checked="settings.haptic" color="#FF7A3D" @change="onHaptic" />
      </view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">护眼模式</text>
          <text class="row-desc">把背景换成柔和的米黄色</text>
        </view>
        <switch :checked="settings.eyeCare" color="#FF7A3D" @change="onEyeCare" />
      </view>
    </view>

    <view class="group">
      <view class="row danger" @click="doClear">
        <view class="row-main">
          <text class="row-title">清空所有数据</text>
          <text class="row-desc">练习记录、统计、错题本一并删除</text>
        </view>
        <text class="row-chev">›</text>
      </view>
    </view>

    <text class="foot">所有数据仅存于本机，卸载即消失</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSettings, saveSettings, clearAll } from '@/common/store'

const goals = [10, 20, 30, 50]
const settings = ref(getSettings())
const eyeCare = computed(() => settings.value.eyeCare)

onShow(() => {
  settings.value = getSettings()
})

function setGoal(g) {
  settings.value = saveSettings({ dailyGoal: g })
}

function onAutoNext(e) {
  settings.value = saveSettings({ autoNext: e.detail.value })
}
function onHaptic(e) {
  settings.value = saveSettings({ haptic: e.detail.value })
}
function onEyeCare(e) {
  settings.value = saveSettings({ eyeCare: e.detail.value })
}

function doClear() {
  uni.showModal({
    title: '清空所有数据？',
    content: '练习记录、正确率统计、错题本都会删除，无法恢复',
    confirmText: '清空',
    confirmColor: '#FF6B6B',
    success: (r) => {
      if (!r.confirm) return
      clearAll()
      uni.showToast({ title: '已清空', icon: 'none' })
      setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 700)
    }
  })
}

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/mine/index' })
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 36rpx;
}
.back {
  width: 64rpx;
  height: 64rpx;
  line-height: 58rpx;
  text-align: center;
  font-size: 46rpx;
  color: #6d6157;
  background: #fff;
  border-radius: 50%;
}
.back.placeholder {
  background: transparent;
}
.nav-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #332c26;
}

.group {
  margin: 28rpx 40rpx 0;
  background: #fff;
  border-radius: 32rpx;
  padding: 8rpx 30rpx;
  box-shadow: 0 10rpx 28rpx rgba(180, 150, 120, 0.1);
}
.group-title {
  padding: 24rpx 0 4rpx;
  font-size: 27rpx;
  font-weight: 700;
  color: #332c26;
}
.pills {
  display: flex;
  padding: 16rpx 0 8rpx;
}
.pill {
  flex: 1;
  margin-right: 14rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #6d6157;
  background: #f8f1e8;
  border-radius: 22rpx;
}
.pill:last-child {
  margin-right: 0;
}
.pill.active {
  background: #332c26;
  color: #fff;
}
.hint {
  display: block;
  padding: 6rpx 0 24rpx;
  font-size: 21rpx;
  color: #c0b3a6;
}

.row {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #f8f1e8;
}
.row:last-child {
  border-bottom: none;
}
.row-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.row-title {
  font-size: 29rpx;
  font-weight: 600;
  color: #332c26;
}
.row-desc {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #a79c92;
}
.row-chev {
  font-size: 38rpx;
  color: #d9c8b8;
}
.row.danger .row-title {
  color: #ff6b6b;
}

.foot {
  display: block;
  text-align: center;
  margin-top: 40rpx;
  font-size: 21rpx;
  color: #c0b3a6;
}
</style>
