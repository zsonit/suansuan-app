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

    <view class="reward" v-if="reward">
      <text class="reward-title">🎉 获得观看时间奖励</text>
      <text class="reward-desc">{{ reward.desc }}</text>
      <view class="reward-btn" v-if="reward.can" @click="claimReward">
        去玩吧 · 解锁 {{ reward.minutes }} 分钟
      </view>
      <view class="reward-btn alt" v-if="reward.can && res.source === 'challenge'" @click="keepChallenge">
        继续挑战 · 每题再 +{{ getWatchRules().perQ || 1 }} 分钟
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
import { takeResult, getSettings, getWatchRules, watchAvailable, getWatchEarned, getDailyProgress, getChallengeDone, claimWatch } from '@/common/store'
import { fmtDuration, exprText } from '@/common/questions'
import { sfx, speak, CHEERS_END_GOOD, CHEERS_END } from '@/common/sound'
import { isServiceOn, startUnlock } from '@/common/kiosk'

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

onLoad(async () => {
  settings.value = getSettings()
  const r = takeResult()
  if (r) res.value = Object.assign(res.value, r)
  // 结算音效 + 语音鼓励
  if (acc.value >= 90) {
    sfx('win')
    speak(CHEERS_END_GOOD[Math.floor(Math.random() * CHEERS_END_GOOD.length)])
  } else {
    sfx('soft')
    speak(CHEERS_END[Math.floor(Math.random() * CHEERS_END.length)])
  }
  await calcReward()
})

// ===== 先学再看：答题解锁观看时间 =====
const reward = ref(null)

async function calcReward() {
  const rules = getWatchRules()
  if (!rules.on) return
  const avail = watchAvailable()
  const src = res.value.source
  if (src === 'daily') {
    // 每日任务：做完 dailyQ 道自动 +dailyMin 分钟
    const p = getDailyProgress()
    reward.value = p.claimed && avail > 0
      ? { can: true, minutes: avail, desc: `每日任务完成！+${rules.dailyMin || 30} 分钟，现在能看 ${avail} 分钟` }
      : { can: avail > 0, minutes: avail, desc: `每日任务还差 ${p.need} 道题，做完就能 +${rules.dailyMin || 30} 分钟` }
    return
  }
  if (src === 'challenge') {
    // 挑战赛：前 chalQ 道换 chalMin 分钟，之后每题 +perQ 分钟，可继续挑战
    const done = getChallengeDone()
    const chalQ = rules.chalQ || 20
    reward.value = {
      can: avail > 0,
      minutes: avail,
      desc:
        done > chalQ
          ? `挑战赛已做 ${done} 题，今天共赚 ${Math.round(getWatchEarned())} 分钟，能看 ${avail} 分钟`
          : `挑战赛进行中 ${done}/${chalQ} 题，赚满 ${rules.chalMin || 30} 分钟后每题再 +${rules.perQ || 1} 分钟`
    }
    return
  }
  if (avail <= 0) {
    reward.value = {
      can: false,
      minutes: 0,
      desc: '观看时间用完啦，回首页做「每日任务」或「挑战赛」赚时间吧！'
    }
    return
  }
  reward.value = {
    can: true,
    minutes: avail,
    desc: `可以看 ${avail} 分钟，时间到会自动回来说「再做一组」`
  }
}

// 挑战赛：继续做一批（每题 +1 分钟），做完回这里领
function keepChallenge() {
  const g = res.value.grade || settings.value.grade || 1
  uni.redirectTo({ url: `/pages/practice/index?source=challenge&count=10&grade=${g}` })
}

async function claimReward() {
  const minutes = reward.value && reward.value.minutes
  if (!minutes) return
  claimWatch() // 记账 + 设定解锁截止
  const svcOn = await isServiceOn()
  if (svcOn) {
    // 暂停自动拉回并回桌面，时间到无障碍服务会把孩子带回练习
    await startUnlock(minutes)
  } else {
    uni.showToast({ title: `解锁 ${minutes} 分钟（未开启锁定服务，仅计时）`, icon: 'none' })
  }
}

function again() {
  const r = res.value
  if (r.source === 'wrong') {
    uni.redirectTo({ url: '/pages/practice/index?source=wrong&count=10' })
    return
  }
  if (r.source === 'daily') {
    uni.redirectTo({
      url: `/pages/practice/index?source=daily&count=${r.count || 30}&grade=${r.grade || 1}`
    })
    return
  }
  if (r.source === 'challenge') {
    keepChallenge()
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
  if (String(r.mode).startsWith('P_')) {
    const pk = String(r.mode).slice(2).replace(/_fun$/, '')
    uni.redirectTo({
      url: `/pages/practice/index?source=point&key=${pk}&fun=${r.mode.endsWith('_fun') ? 1 : ''}&count=${r.count || 10}`
    })
    return
  }
  if (String(r.mode).startsWith('O_')) {
    uni.redirectTo({
      url: `/pages/practice/index?source=open&key=${String(r.mode).slice(2)}&count=${r.count || 10}`
    })
    return
  }
  if (String(r.mode).startsWith('L_')) {
    uni.redirectTo({
      url: `/pages/practice/index?source=lemiao&key=${String(r.mode).slice(2)}&count=${r.count || 10}`
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
  padding-top: calc(max(env(safe-area-inset-top), var(--status-bar-height, 0px)) + 16rpx);
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

.reward {
  margin: 24rpx 40rpx 0;
  background: linear-gradient(135deg, #e9fbf1, #d6f5e3);
  border: 3rpx solid #bfe8cf;
  border-radius: 32rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.reward-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #2e8b57;
}
.reward-desc {
  margin-top: 10rpx;
  font-size: 23rpx;
  color: #4c8a68;
  text-align: center;
  line-height: 1.5;
}
.reward-btn {
  margin-top: 22rpx;
  padding: 0 60rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #34c98e, #2fbf87);
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  border-radius: 100rpx;
  box-shadow: 0 12rpx 28rpx rgba(47, 191, 135, 0.35);
}
.reward-btn.alt {
  background: #ffffff;
  color: #ff7a3d;
  border: 3rpx solid #ffc9a6;
  box-shadow: none;
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
