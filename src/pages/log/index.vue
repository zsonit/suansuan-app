<template>
  <view class="page">
    <view class="nav">
      <view class="nav-row">
        <text class="back" @click="back">‹ 返回</text>
        <text class="title">检修日志</text>
        <text class="spacer"></text>
      </view>
      <text class="sub">{{ diag.on ? '正在记录 · 出问题时复现一次再导出' : '记录已关闭，打开开关后才会记录新事件' }}</text>
    </view>

    <view class="ops">
      <view class="op" @click="doExport">导出分享</view>
      <view class="op ghost" @click="doCopy">复制全文</view>
      <view class="op ghost" @click="load">刷新</view>
    </view>

    <scroll-view scroll-y class="body" :show-scrollbar="false">
      <view class="card">
        <view class="card-t">设备与环境</view>
        <text class="env">{{ info || '读取中…' }}</text>
      </view>
      <view class="card">
        <view class="card-t">
          <text>事件记录</text>
          <text class="count">{{ lines.length }} 行</text>
        </view>
        <view class="log">
          <text v-if="!lines.length" class="empty">还没有记录。\n先去设置打开「记录检修日志」，复现一次问题（比如切出 APP 看会不会被拉回），再回来刷新。</text>
          <text v-for="(l, i) in lines" :key="i" class="line" :class="cls(l)">{{ l }}</text>
        </view>
      </view>
      <view class="foot">日志最多保留约 512KB，超出自动保留最近部分；不会上传到任何服务器</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { diagStatus, tailLog, systemInfo, exportLog, clearLog } from '@/common/diag'

const diag = ref({ on: false, size: 0 })
const info = ref('')
const lines = ref([])

function back() {
  uni.navigateBack()
}

async function load() {
  diag.value = await diagStatus()
  info.value = await systemInfo()
  const text = await tailLog(400)
  lines.value = text.split('\n').filter((x) => x.trim())
}

onShow(load)

function cls(l) {
  if (!l) return ''
  if (l.indexOf('[a11y]') >= 0) return 'c-a11y'
  if (l.indexOf('[pull]') >= 0) return 'c-pull'
  if (l.indexOf('[watchdog]') >= 0) return 'c-wd'
  if (l.indexOf('[kiosk]') >= 0) return 'c-kiosk'
  if (l.indexOf('失败') >= 0) return 'c-err'
  return ''
}

async function doExport() {
  const r = await exportLog()
  if (r && r.path) uni.showToast({ title: '已打开分享', icon: 'success' })
  else uni.showToast({ title: '导出失败', icon: 'none' })
}

function doCopy() {
  const all = [info.value, '', ...lines.value].join('\n')
  uni.setClipboardData({
    data: all,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #fdf9f4;
  display: flex;
  flex-direction: column;
}
.nav {
  padding: 16rpx 32rpx 0;
}
.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.back {
  font-size: 28rpx;
  color: #b3a496;
  width: 130rpx;
}
.title {
  font-size: 34rpx;
  font-weight: 800;
  color: #332c26;
}
.spacer {
  width: 130rpx;
}
.sub {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #a89a8c;
  line-height: 1.6;
}
.ops {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx 4rpx;
}
.op {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
  font-size: 25rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 20rpx rgba(255, 122, 61, 0.22);
}
.op.ghost {
  background: #fff;
  color: #e2622a;
  border: 2rpx solid #ffd3b5;
  box-shadow: none;
}
.body {
  flex: 1;
  padding: 0 32rpx 30rpx;
  box-sizing: border-box;
}
.card {
  margin-top: 20rpx;
  background: #fff;
  border-radius: 22rpx;
  padding: 26rpx 24rpx;
  border: 2rpx solid #fdeee0;
}
.card-t {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 25rpx;
  font-weight: 800;
  color: #332c26;
}
.count {
  font-size: 21rpx;
  color: #b8a99b;
  font-weight: 500;
}
.env {
  display: block;
  margin-top: 14rpx;
  font-size: 21rpx;
  color: #7d6f63;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
}
.log {
  margin-top: 14rpx;
  max-height: 60vh;
}
.line {
  display: block;
  font-size: 20rpx;
  line-height: 1.75;
  color: #6b5f55;
  font-family: Menlo, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
.c-a11y {
  color: #2f8fbf;
}
.c-pull {
  color: #d9531f;
}
.c-wd {
  color: #8a63d2;
}
.c-kiosk {
  color: #2fbf87;
}
.c-err {
  color: #e5484d;
}
.empty {
  display: block;
  font-size: 23rpx;
  color: #ab9d90;
  line-height: 1.9;
  white-space: pre-wrap;
}
.foot {
  margin-top: 24rpx;
  text-align: center;
  font-size: 20rpx;
  color: #b6a89a;
  line-height: 1.7;
}
</style>
