<template>
  <view class="page" :class="{ eye: eyeCare }">
    <view class="nav">
      <view class="nav-row">
        <text class="brand">算算星球</text>
        <text class="streak" v-if="streak > 0">🔥 连续 {{ streak }} 天</text>
      </view>
      <text class="sub">今天已练 {{ today.n }} 题 · 答对 {{ today.right }} 题</text>
    </view>

    <view class="watch-card" v-if="watchOn">
      <view class="watch-live" v-if="unlockLeftMin > 0">
        <text class="watch-live-icon">🍿</text>
        <view class="watch-live-main">
          <text class="watch-live-title">自由时间</text>
          <text class="watch-live-left">还剩 {{ unlockLeftMin }} 分钟</text>
        </view>
        <text class="watch-live-pct">{{ watchUsed }}/{{ watchCap }} 分</text>
      </view>
      <view class="watch-stats">
        <view class="watch-cell">
          <text class="watch-num">{{ watchUsed }}</text>
          <text class="watch-label">今日已看(分钟)</text>
        </view>
        <view class="watch-cell">
          <text class="watch-num">{{ watchLeft }}</text>
          <text class="watch-label">还能看(分钟)</text>
        </view>
        <view class="watch-cell">
          <text class="watch-num">{{ watchEarn }}</text>
          <text class="watch-label">做题赚的(分钟)</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="body" :show-scrollbar="false">
      <view class="hero" @click="startGrade">
        <view class="hero-deco">✨</view>
        <text class="hero-title">{{ gradeSel ? gradeName + '综合练习' : '今天想练点什么？' }}</text>
        <text class="hero-sub" v-if="gradeSel">点这里一键开练，题型难度都按 {{ gradeName }} 课标来</text>
        <text class="hero-sub" v-else>点卡片就能直接开始练习</text>
        <view class="goal">
          <view class="goal-bar">
            <view class="goal-fill" :style="{ width: goalPct + '%' }"></view>
          </view>
          <text class="goal-text">今日目标 {{ settings.dailyGoal }} 题，已完成 {{ goalPct }}%</text>
        </view>
      </view>

      <!-- 学段闯关：直接外显，点一下直达对应学段 -->
      <view class="sec-title stages-title">
        <text class="sec-emoji">🏅</text>
        学段闯关 · {{ TOTAL_POINTS }} 个知识点
      </view>
      <view class="stage-chips">
        <view
          v-for="s in STAGES"
          :key="s.key"
          class="schip"
          @click="goStage(s.key)"
        >
          <text class="schip-icon">{{ s.icon }}</text>
          <text class="schip-name">{{ s.name }}</text>
        </view>
      </view>

      <view class="sec-title">年级</view>
      <view class="grade-pills">
        <view class="gpill" :class="{ active: gradeSel === 0 }" @click="selectGrade(0)">
          全部
        </view>
        <view
          v-for="g in GRADES"
          :key="g.key"
          class="gpill"
          :class="{ active: gradeSel === g.key }"
          @click="selectGrade(g.key)"
        >
          {{ g.emoji }} {{ g.name }}
        </view>
      </view>

      <template v-for="g in viewGroups" :key="g.key">
        <view class="sec-title">
          <text class="sec-emoji">{{ g.emoji }}</text>
          {{ g.name }}
        </view>
        <view class="modes">
          <view
            v-for="m in g.modes"
            :key="m.key"
            class="mode"
            :class="{ active: mode === m.key }"
            @click="selectMode(m)"
          >
            <view class="mode-pic">
              <image class="mode-img" :src="m.img || g.img" mode="aspectFill" />
              <text class="tick" v-if="mode === m.key">✓</text>
            </view>
            <view class="mode-info">
              <text class="mode-name">{{ m.name }}</text>
              <text class="mode-desc">{{ m.desc }}</text>
            </view>
          </view>
        </view>
      </template>

      <template v-for="g in lemiaoView" :key="g.key">
        <view class="sec-title">
          <text class="sec-emoji">{{ g.icon }}</text>
          {{ g.name }}
        </view>
        <text class="sec-desc">{{ g.desc }}</text>
        <view class="modes">
          <view
            v-for="a in g.acts"
            :key="a.key"
            class="mode"
            @click="startLemiao(a)"
          >
            <view class="mode-pic">
              <text class="mode-fallback">{{ a.icon || '⭐' }}</text>
              <image class="mode-img" :src="a.img" mode="aspectFill" lazy-load />
            </view>
            <view class="mode-info">
              <text class="mode-name">{{ a.name }}</text>
              <text class="mode-desc">{{ a.desc }}</text>
            </view>
          </view>
        </view>
      </template>

      <template v-if="openView.length">
        <view class="sec-title">
          <text class="sec-emoji">🎓</text>
          题了个题 · 开放题库
        </view>
        <text class="sec-desc">来自开源项目 StudyOnTV 的精选题库（50 题）</text>
        <view class="modes">
          <view
            v-for="b in openView"
            :key="b.key"
            class="mode"
            @click="startOpen(b.key)"
          >
            <view class="mode-pic">
              <text class="mode-fallback">{{ b.icon }}</text>
            </view>
            <view class="mode-info">
              <text class="mode-name">{{ b.name }}</text>
              <text class="mode-desc">{{ b.desc }}</text>
            </view>
          </view>
        </view>
      </template>

      <template v-if="!isLang">
        <view class="sec-title">难度</view>
        <view class="pills">
          <view
            v-for="l in availLevels"
            :key="l.key"
            class="pill"
            :class="{ active: difficulty === l.key }"
            @click="difficulty = l.key"
          >
            {{ l.name }}
          </view>
        </view>
      </template>

      <view class="sec-title">这一组做几题</view>
      <view class="pills">
        <view
          v-for="c in COUNTS"
          :key="c"
          class="pill"
          :class="{ active: count === c }"
          @click="count = c"
        >
          {{ c }} 题
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { GROUPS, GRADES, LEVELS, COUNTS, modeOf } from '@/common/questions'
import { LEMIAO_GROUPS } from '@/common/lemiao'
import { STAGES, TOTAL_POINTS } from '@/common/stages'
import { OPEN_BANKS } from '@/common/openbank'
import { sfx } from '@/common/sound'
import { getSettings, getToday, getStreak, getUnlockUntil, getWatchRules, getWatchUsed, getWatchEarned, watchAvailable } from '@/common/store'

const gradeSel = ref(1)
const mode = ref('add')
const difficulty = ref(1)
const count = ref(10)

// 当前年级下可见的模式（带推荐难度）；0 = 全部
// 数学模式按年级课表过滤；语文/英语按自身 grades 过滤；英语仅 3 年级及以上；趣味游戏始终可见
const viewGroups = computed(() => {
  const grade = gradeSel.value
  if (!grade) return GROUPS
  const rec = new Map(GRADES.find((g) => g.key === grade).items)
  const out = []
  for (const g of GROUPS) {
    if (g.key === 'game') {
      out.push(g)
      continue
    }
    if (g.key === 'cn' || g.key === 'en') {
      if (g.key === 'en' && grade < 3) continue
      const modes = g.modes.filter((m) => !m.grades || m.grades.includes(grade))
      if (modes.length) out.push({ ...g, modes })
      continue
    }
    const modes = g.modes
      .filter((m) => rec.has(m.key))
      .map((m) => ({ ...m, rec: rec.get(m.key) }))
    if (modes.length) out.push({ ...g, modes })
  }
  return out
})

const isLang = computed(() => {
  const m = modeOf(mode.value)
  return !!(m && m.lang)
})

// 乐喵题卡：7 大分组 105 张，按年级过滤（0=全部）
const LEMIAO_ICONS = {
  'number-sense': '🌈',
  'number-composition': '🧩',
  'basic-calculation': '📝',
  'advanced-calculation': '🚀',
  'patterns-reasoning': '🔮',
  'geometry-figures': '🔺',
  'measurement-life': '📏'
}
const lemiaoView = computed(() => {
  const grade = gradeSel.value
  const out = []
  for (const g of LEMIAO_GROUPS) {
    const acts = grade ? g.acts.filter((a) => a.grades.includes(grade)) : g.acts
    if (acts.length) out.push({ key: g.key, name: g.name, desc: g.desc, icon: LEMIAO_ICONS[g.key] || '⭐', acts })
  }
  return out
})

function startLemiao(a) {
  uni.navigateTo({
    url: `/pages/practice/index?source=lemiao&key=${a.key}&count=${count.value}`
  })
  sfx('start')
}

// 题了个题开放题库
const openView = Object.values(OPEN_BANKS).map((b) => ({
  key: b.key,
  name: b.name,
  icon: b.icon,
  desc: b.desc
}))

function startOpen(bankKey) {
  uni.navigateTo({
    url: `/pages/practice/index?source=open&key=${bankKey}&count=${count.value}`
  })
  sfx('start')
}

const availLevels = computed(() => {
  const m = modeOf(mode.value)
  return LEVELS.filter((l) => !m || !m.levels || m.levels.includes(l.key))
})

function applyMode(m) {
  mode.value = m.key
  if (m.rec) {
    difficulty.value = m.rec
  } else if (m.levels && !m.levels.includes(difficulty.value)) {
    difficulty.value = m.levels[0]
  }
}

function selectMode(m) {
  applyMode(m)
  // 点卡片直接开练（不用再按底部按钮）
  start()
}

function selectGrade(k) {
  gradeSel.value = k
  // 切年级后当前模式若不在该年级，选该年级第一个模式
  const all = viewGroups.value.flatMap((g) => g.modes)
  const cur = all.find((m) => m.key === mode.value)
  applyMode(cur || all[0])
}

const settings = ref(getSettings())
const today = ref(getToday())
const streak = ref(0)

const eyeCare = computed(() => settings.value.eyeCare)
const gradeName = computed(() => {
  const g = GRADES.find((x) => x.key === gradeSel.value)
  return g ? g.name : ''
})
const goalPct = computed(() => {
  const goal = settings.value.dailyGoal || 20
  return Math.min(100, Math.round((today.value.n / goal) * 100))
})

onShow(() => {
  settings.value = getSettings()
  today.value = getToday()
  streak.value = getStreak()
  refreshUnlock()
  refreshWatch()
})

// 先学再看：观看时间卡（今日已看 / 还能看 / 做题赚的）
const watchOn = ref(false)
const watchUsed = ref(0)
const watchEarn = ref(0)
const watchLeft = ref(0)
function refreshWatch() {
  const r = getWatchRules()
  watchOn.value = !!r.on
  watchUsed.value = getWatchUsed()
  watchEarn.value = getWatchEarned()
  watchLeft.value = watchAvailable()
}

// 自由时间倒计时横幅
const now = ref(Date.now())
let unlockTick = null
const unlockUntil = ref(0)
const unlockLeftMin = computed(() => {
  if (!unlockUntil.value) return 0
  return Math.max(0, Math.ceil((unlockUntil.value - now.value) / 60000))
})
function refreshUnlock() {
  unlockUntil.value = getUnlockUntil()
  if (unlockUntil.value > Date.now() && !unlockTick) {
    unlockTick = setInterval(() => {
      now.value = Date.now()
      if (now.value >= unlockUntil.value) {
        clearInterval(unlockTick)
        unlockTick = null
        unlockUntil.value = 0
      }
    }, 15000)
  }
}
onUnmounted(() => {
  if (unlockTick) clearInterval(unlockTick)
})

const GAME_KEYS = ['balloon', 'match', 'racer', 'balance', 'memory']

function start() {
  // 趣味游戏跳独立页面
  if (GAME_KEYS.includes(mode.value)) {
    uni.navigateTo({
      url: `/pages/${mode.value}/index?difficulty=${difficulty.value}&count=${count.value}&grade=${gradeSel.value || 0}`
    })
    return
  }
  uni.navigateTo({
    url: `/pages/practice/index?mode=${mode.value}&difficulty=${difficulty.value}&count=${count.value}`
  })
}

function goStage(key) {
  uni.navigateTo({
    url: `/pages/stages/index?stage=${key}&grade=${gradeSel.value || 0}`
  })
}

function startGrade() {
  if (!gradeSel.value) return
  uni.navigateTo({
    url: `/pages/practice/index?source=grade&grade=${gradeSel.value}&count=${count.value}`
  })
}
</script>

<style scoped>
.page {
  height: 100vh;
  box-sizing: border-box;
  padding-top: calc(max(env(safe-area-inset-top), var(--status-bar-height, 0px)) + 24rpx);
  background: #fff9f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  letter-spacing: 2rpx;
}
.streak {
  font-size: 24rpx;
  color: #ff7a3d;
  background: #ffe7d6;
  padding: 8rpx 18rpx;
  border-radius: 100rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #a79c92;
}

.watch-card {
  margin: 16rpx 40rpx 0;
  background: linear-gradient(135deg, #eafaf1, #ddf3e7);
  border: 3rpx solid #bfe8cf;
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
}
.watch-live {
  display: flex;
  align-items: center;
  padding-bottom: 16rpx;
  border-bottom: 2rpx dashed #bfe8cf;
  margin-bottom: 16rpx;
}
.watch-live-icon {
  font-size: 44rpx;
  margin-right: 16rpx;
}
.watch-live-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.watch-live-title {
  font-size: 26rpx;
  font-weight: 800;
  color: #2e8b57;
}
.watch-live-left {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #4c8a68;
}
.watch-live-pct {
  font-size: 24rpx;
  font-weight: 700;
  color: #2e8b57;
  background: #fff;
  border-radius: 100rpx;
  padding: 8rpx 18rpx;
}
.watch-stats {
  display: flex;
}
.watch-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.watch-num {
  font-size: 40rpx;
  font-weight: 800;
  color: #2e8b57;
}
.watch-label {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #6fa98a;
}

.body {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0 40rpx 40rpx;
}

.hero {
  position: relative;
  margin-top: 32rpx;
  background: linear-gradient(135deg, #ffb27a 0%, #ff7a3d 100%);
  border-radius: 40rpx;
  padding: 40rpx 36rpx 34rpx;
  box-shadow: 0 18rpx 40rpx rgba(255, 122, 61, 0.28);
  overflow: hidden;
}

/* 学段直达 chips */
.stages-title {
  margin-top: 40rpx;
}
.stage-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.schip {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 100rpx;
  padding: 14rpx 26rpx 14rpx 18rpx;
  box-shadow: 0 6rpx 18rpx rgba(180, 150, 120, 0.1);
  border: 3rpx solid #ffe9d2;
}
.schip:active {
  transform: scale(0.95);
}
.schip-icon {
  font-size: 30rpx;
  margin-right: 8rpx;
}
.schip-name {
  font-size: 26rpx;
  font-weight: 700;
  color: #6d6157;
}
.hero-deco {
  position: absolute;
  right: 24rpx;
  top: 14rpx;
  font-size: 90rpx;
  opacity: 0.25;
}
.hero-title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #fff;
}
.hero-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  color: rgba(255, 255, 255, 0.9);
}
.goal {
  margin-top: 34rpx;
}
.goal-bar {
  height: 16rpx;
  border-radius: 100rpx;
  background: rgba(255, 255, 255, 0.35);
  overflow: hidden;
}
.goal-fill {
  height: 100%;
  border-radius: 100rpx;
  background: #fff;
}
.goal-text {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.95);
}

.sec-title {
  margin: 44rpx 0 20rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #332c26;
  display: flex;
  align-items: center;
}
.sec-emoji {
  margin-right: 10rpx;
  font-size: 32rpx;
}
.sec-desc {
  display: block;
  margin: -8rpx 0 20rpx;
  font-size: 22rpx;
  color: #b3a897;
  line-height: 1.5;
}

.modes {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.mode {
  position: relative;
  width: 48%;
  box-sizing: border-box;
  background: #fff;
  border: 3rpx solid #fff;
  border-radius: 32rpx;
  padding: 14rpx 14rpx 20rpx;
  margin-bottom: 22rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8rpx 24rpx rgba(180, 150, 120, 0.1);
}
.mode.active {
  border-color: #ff7a3d;
  background: #fff6ee;
  box-shadow: 0 12rpx 28rpx rgba(255, 122, 61, 0.18);
}
.mode-pic {
  position: relative;
  height: 180rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: #fff3e6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mode-fallback {
  font-size: 90rpx;
}
.mode-img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.mode-pic .tick {
  position: absolute;
  right: 12rpx;
  top: 10rpx;
  width: 44rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  border-radius: 50%;
  background: #ff7a3d;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(255, 122, 61, 0.4);
}
.mode-info {
  display: flex;
  flex-direction: column;
  padding: 14rpx 10rpx 0;
}
.mode-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #332c26;
}
.mode-desc {
  font-size: 20rpx;
  color: #a79c92;
  margin-top: 6rpx;
}

.grade-pills {
  display: flex;
  flex-wrap: wrap;
}
.gpill {
  margin: 0 16rpx 16rpx 0;
  padding: 0 30rpx;
  height: 76rpx;
  line-height: 76rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #6d6157;
  background: #fff;
  border-radius: 100rpx;
  box-shadow: 0 6rpx 18rpx rgba(180, 150, 120, 0.08);
}
.gpill.active {
  background: #332c26;
  color: #fff;
}

.pills {
  display: flex;
}
.pill {
  flex: 1;
  margin-right: 18rpx;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  font-size: 27rpx;
  color: #6d6157;
  background: #fff;
  border-radius: 24rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 18rpx rgba(180, 150, 120, 0.08);
}
.pill:last-child {
  margin-right: 0;
}
.pill.active {
  background: #332c26;
  color: #fff;
}

</style>
