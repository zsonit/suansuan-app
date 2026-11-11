<template>
  <view class="page" :class="{ eye: settings.eyeCare }">
    <view class="nav">
      <view class="nav-row">
        <text class="brand">错题本</text>
        <text class="count" v-if="list.length">{{ list.length }} 题</text>
      </view>
      <text class="sub">做错的题会自动收进来，反复错的排在前面</text>
    </view>

    <view class="tools" v-if="list.length">
      <view class="tool primary" @click="redoAll">重做全部</view>
      <view class="tool" @click="clearAllWrong">清空</view>
    </view>

    <view class="list" v-if="list.length">
      <view class="item" v-for="w in list" :key="w.text" @click="onItem(w)">
        <view class="item-left">
          <text class="expr">{{ exprText(w) }}</text>
          <text class="meta">{{ modeText(w.mode) }} · 错了 {{ w.count }} 次</text>
        </view>
        <text class="chev">›</text>
      </view>
    </view>

    <view class="empty" v-else>
      <text class="empty-emoji">🌱</text>
      <text class="empty-title">错题本是空的</text>
      <text class="empty-sub">去练一组，错的题会出现在这里</text>
      <view class="empty-btn" @click="goPractice">去练习</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getWrong, removeWrong, clearWrong, getSettings } from '@/common/store'
import { modeName, exprText } from '@/common/questions'

const list = ref([])
const settings = ref(getSettings())
const eyeCare = computed(() => settings.value.eyeCare)

onShow(() => {
  settings.value = getSettings()
  list.value = getWrong()
})

function modeText(m) {
  return m === 'wrong' ? '错题重练' : modeName(m)
}

function onItem(w) {
  uni.showActionSheet({
    itemList: ['删除这道题'],
    success: (r) => {
      if (r.tapIndex === 0) {
        removeWrong(w.text)
        list.value = getWrong()
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    }
  })
}

function redoAll() {
  uni.navigateTo({ url: '/pages/practice/index?source=wrong' })
}

function clearAllWrong() {
  uni.showModal({
    title: '清空错题本？',
    content: '清空后无法恢复',
    confirmText: '清空',
    success: (r) => {
      if (r.confirm) {
        clearWrong()
        list.value = []
        uni.showToast({ title: '已清空', icon: 'none' })
      }
    }
  })
}

function goPractice() {
  uni.switchTab({ url: '/pages/index/index' })
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
.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-size: 44rpx;
  font-weight: 800;
  color: #332c26;
}
.count {
  font-size: 24rpx;
  color: #ff7a3d;
  background: #ffe7d6;
  padding: 8rpx 20rpx;
  border-radius: 100rpx;
  font-weight: 700;
}
.sub {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: #a79c92;
}

.tools {
  display: flex;
  padding: 32rpx 40rpx 0;
}
.tool {
  height: 84rpx;
  line-height: 84rpx;
  padding: 0 40rpx;
  border-radius: 24rpx;
  font-size: 27rpx;
  font-weight: 700;
  color: #6d6157;
  background: #fff;
  margin-right: 20rpx;
  box-shadow: 0 8rpx 20rpx rgba(180, 150, 120, 0.1);
}
.tool.primary {
  background: #332c26;
  color: #fff;
}

.list {
  padding: 28rpx 40rpx 0;
}
.item {
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx 30rpx;
  margin-bottom: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8rpx 24rpx rgba(180, 150, 120, 0.1);
}
.item-left {
  display: flex;
  flex-direction: column;
}
.expr {
  font-size: 34rpx;
  font-weight: 700;
  color: #332c26;
}
.meta {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #a79c92;
}
.chev {
  font-size: 40rpx;
  color: #d9c8b8;
}

.empty {
  padding: 160rpx 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-emoji {
  font-size: 90rpx;
}
.empty-title {
  margin-top: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #4c433b;
}
.empty-sub {
  margin-top: 12rpx;
  font-size: 25rpx;
  color: #a79c92;
}
.empty-btn {
  margin-top: 40rpx;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 60rpx;
  border-radius: 100rpx;
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 14rpx 28rpx rgba(255, 122, 61, 0.3);
}
</style>
