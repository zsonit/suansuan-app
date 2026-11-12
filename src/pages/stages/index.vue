<template>
  <view class="page">
    <view class="top">
      <view class="back" @click="goBack">‹</view>
      <text class="title">闯关学段</text>
      <text class="total">{{ TOTAL_POINTS }} 个知识点</text>
    </view>

    <!-- 学段切换 -->
    <scroll-view class="tabs" scroll-x :show-scrollbar="false">
      <view class="tabs-in">
        <view
          v-for="s in stageView"
          :key="s.key"
          class="tab"
          :class="{ active: cur === s.key }"
          @click="selectStage(s.key)"
        >
          <text class="tab-icon">{{ s.icon }}</text>
          <text class="tab-name">{{ s.name }}</text>
          <text class="tab-sub">{{ stagePointCount(s) }} 个</text>
        </view>
      </view>
    </scroll-view>

    <view class="body" v-if="stage">
      <text class="stage-desc">{{ stage.desc }}</text>

      <template v-for="(lv, li) in stage.levels" :key="li">
        <view class="lv-title">
          <text class="lv-badge">L{{ li + 1 }}</text>
          {{ lv.title }}
        </view>
        <view class="unit" v-for="(u, ui) in lv.units" :key="ui">
          <view class="unit-head">
            <text class="unit-emoji">{{ u.emoji }}</text>
            <text class="unit-name">{{ u.title }}</text>
          </view>
          <view class="point" v-for="p in filterPoints(u)" :key="p.key">
            <view class="point-info">
              <text class="point-name">{{ p.title }}</text>
              <text class="point-desc">{{ p.desc }}</text>
            </view>
            <view class="point-btns">
              <view
                class="pbtn fun"
                v-if="isLow(p)"
                @click="start(p, 1)"
              >趣味互动</view>
              <view class="pbtn test" @click="start(p, 0)">智能测验</view>
            </view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { STAGES, stagePointCount, TOTAL_POINTS } from '@/common/stages'

const cur = ref('prek')
const grade = ref(0)

const stage = computed(() => STAGES.find((s) => s.key === cur.value))
// 低段知识点显示「趣味互动」（配对玩法）
const isLow = (p) => [7, 1, 2, 3].includes(p.g)

const stageView = computed(() => STAGES)

function filterPoints(u) {
  // 学段闯关展示该学段全部知识点，不按年级过滤（进阶及以上学段与所选年级无关，过滤会导致空列表）
  return u.points
}

onLoad((q) => {
  if (q.stage) cur.value = q.stage
  grade.value = Number(q.grade || 0)
  if (!STAGES.find((s) => s.key === cur.value)) cur.value = STAGES[0].key
})

function selectStage(k) {
  cur.value = k
}

function start(p, fun) {
  uni.navigateTo({
    url: `/pages/practice/index?source=point&key=${p.key}&fun=${fun || ''}&count=${fun ? 6 : 8}`
  })
}

function goBack() {
  uni.navigateBack()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #faf4ea;
}
.top {
  display: flex;
  align-items: center;
  padding: calc(20rpx + env(safe-area-inset-top)) 30rpx 20rpx;
  position: sticky;
  top: 0;
  background: #faf4ea;
  z-index: 9;
}
.back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 800;
  color: #8a7a66;
  margin-right: 20rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 900;
  color: #332c26;
  flex: 1;
}
.total {
  font-size: 22rpx;
  color: #b3a897;
}
.tabs {
  white-space: nowrap;
  padding: 0 24rpx;
}
.tabs-in {
  display: inline-flex;
  gap: 14rpx;
  padding: 6rpx 2rpx 18rpx;
}
.tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 3rpx solid #f0e6d6;
  border-radius: 22rpx;
  padding: 14rpx 26rpx;
  min-width: 130rpx;
}
.tab.active {
  background: linear-gradient(160deg, #ff9a4d, #ff7a3c);
  border-color: transparent;
}
.tab.active .tab-name,
.tab.active .tab-sub {
  color: #fff;
}
.tab-icon {
  font-size: 40rpx;
  line-height: 1.2;
}
.tab-name {
  font-size: 26rpx;
  font-weight: 800;
  color: #332c26;
  margin-top: 4rpx;
}
.tab-sub {
  font-size: 20rpx;
  color: #b3a897;
}
.body {
  padding: 6rpx 28rpx 60rpx;
}
.stage-desc {
  display: block;
  font-size: 24rpx;
  color: #a79c92;
  margin: 6rpx 4rpx 20rpx;
}
.lv-title {
  display: flex;
  align-items: center;
  margin: 30rpx 4rpx 16rpx;
  font-size: 30rpx;
  font-weight: 900;
  color: #5a4a3a;
}
.lv-badge {
  background: #ffe3c8;
  color: #c46a1d;
  border-radius: 10rpx;
  font-size: 22rpx;
  font-weight: 900;
  padding: 4rpx 12rpx;
  margin-right: 12rpx;
}
.unit {
  background: #fff;
  border-radius: 26rpx;
  padding: 22rpx 22rpx 8rpx;
  margin-bottom: 22rpx;
  box-shadow: 0 8rpx 24rpx rgba(180, 150, 120, 0.08);
}
.unit-head {
  display: flex;
  align-items: center;
  padding-bottom: 12rpx;
  border-bottom: 2rpx dashed #f0e6d6;
}
.unit-emoji {
  font-size: 34rpx;
  margin-right: 10rpx;
}
.unit-name {
  font-size: 27rpx;
  font-weight: 800;
  color: #5a4a3a;
}
.point {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 2rpx solid #faf5ec;
}
.point:last-child {
  border-bottom: none;
}
.point-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.point-name {
  font-size: 27rpx;
  font-weight: 700;
  color: #332c26;
}
.point-desc {
  font-size: 21rpx;
  color: #a79c92;
  margin-top: 4rpx;
}
.point-btns {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
  margin-left: 14rpx;
}
.pbtn {
  font-size: 22rpx;
  font-weight: 800;
  border-radius: 999rpx;
  padding: 12rpx 22rpx;
}
.pbtn.fun {
  background: linear-gradient(160deg, #ffb45c, #ff8a3c);
  color: #fff;
}
.pbtn.test {
  background: #f4ede1;
  color: #8a7a66;
}
.pbtn:active {
  transform: scale(0.94);
}
</style>
