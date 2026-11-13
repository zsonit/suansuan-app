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
          {{ watchOn ? `📺 今日已用 ${watchUsed} 分钟 · 还能用 ${watchLeft} 分钟` : '📺 先学再看未开启 · 点这里去开启' }}
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
      <view class="row" @click="openTemp">
        <text class="row-icon">🔓</text>
        <text class="row-text">家长临时解锁</text>
        <text class="row-val">5 分钟 ~ 2 小时</text>
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

    <!-- 家长门禁：设过锁定密码后需验证才能进 -->
    <view class="gate" v-if="gated">
      <text class="gate-icon">🔒</text>
      <text class="gate-title">家长验证</text>
      <text class="gate-desc">请输入锁定密码进入「我的」</text>
      <input
        class="gate-input"
        type="number"
        :password="true"
        maxlength="6"
        v-model="gatePin"
        placeholder="6 位数字密码"
      />
      <text class="gate-err" v-if="gateErr">{{ gateErr }}</text>
      <view class="gate-btn" @click="gateSubmit">解锁</view>
    </view>

    <!-- 家长临时解锁：输密码 → 选时长 → 临时放行（不是关闭锁定） -->
    <view class="gate" v-if="tempOpen">
      <text class="gate-icon">🔓</text>
      <text class="gate-title">家长临时解锁</text>

      <template v-if="tempStep === 'pin'">
        <text class="gate-desc">输入锁定密码，临时用一下手机</text>
        <input
          class="gate-input"
          type="number"
          :password="true"
          maxlength="6"
          v-model="tempPin"
          placeholder="6 位数字密码"
        />
        <text class="gate-err" v-if="tempErr">{{ tempErr }}</text>
        <text class="gate-sub">这只是临时解锁，锁定不会关闭；想彻底关闭请到「练习设置」</text>
        <view class="gate-btn" @click="tempPinOk">确定</view>
        <text class="gate-cancel" @click="tempOpen = false">取消</text>
      </template>

      <template v-else>
        <text class="gate-desc">选择临时使用时长，到点自动恢复锁定</text>
        <view class="temp-pills">
          <view
            v-for="m in TEMP_OPTS"
            :key="m"
            class="temp-pill"
            :class="{ active: tempMin === m && !tempCustom }"
            @click="pickTemp(m)"
          >
            {{ m >= 60 ? m / 60 + ' 小时' : m + ' 分钟' }}
          </view>
        </view>
        <view class="temp-custom">
          <text class="temp-custom-label">自定义</text>
          <input
            class="temp-custom-input"
            type="number"
            v-model="tempCustom"
            placeholder="输入分钟数"
            @input="tempMin = 0"
          />
          <text class="temp-custom-unit">分钟</text>
        </view>
        <text class="gate-sub">临时解锁不扣孩子的使用时间；到点后自动恢复锁定</text>
        <view class="gate-btn" @click="tempConfirm">临时解锁 {{ tempText }}</view>
        <text class="gate-cancel" @click="tempOpen = false">取消</text>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getStats, getToday, getStreak, getWrong, getSettings, saveSettings, getHistory, getWatchRules, getWatchUsed, watchAvailable } from '@/common/store'
import { getConfig, verifyPin, gateOpen, gatePass, gateNeeded, lockoutLeft, addWrongAttempt, resetAttempts, isEnabled, startUnlock } from '@/common/kiosk'

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
const watchLeft = ref(0)

// ===== 家长门禁 =====
const gated = ref(false)
const gatePin = ref('')
const gateErr = ref('')
let gateBusy = false

async function gateSubmit() {
  if (gateBusy) return
  const left = lockoutLeft()
  if (left > 0) {
    gateErr.value = `错太多次了，${Math.ceil(left / 1000)} 秒后再试`
    return
  }
  gateBusy = true
  try {
    const cfg = await getConfig()
    if (await verifyPin(cfg, gatePin.value)) {
      gatePass()
      resetAttempts()
      gated.value = false
      gatePin.value = ''
      gateErr.value = ''
      // 门开后再拉一次数据
      stats.value = getStats()
      today.value = getToday()
      streak.value = getStreak()
      wrongCount.value = getWrong().length
      settings.value = getSettings()
      nick.value = settings.value.nick || '小学员'
    } else {
      addWrongAttempt()
      const l2 = lockoutLeft()
      gateErr.value = l2 > 0 ? '连错 5 次，锁定 5 分钟' : '密码不对，再想想'
      gatePin.value = ''
    }
  } finally {
    gateBusy = false
  }
}

onShow(async () => {
  const need = await gateNeeded()
  gated.value = need && !gateOpen()
  if (gated.value) {
    gatePin.value = ''
    gateErr.value = ''
    return
  }
  stats.value = getStats()
  today.value = getToday()
  streak.value = getStreak()
  wrongCount.value = getWrong().length
  settings.value = getSettings()
  days.value = Object.keys(stats.value.days || {}).length
  nick.value = settings.value.nick || '小学员'
  const r = getWatchRules()
  watchOn.value = !!r.on
  watchUsed.value = getWatchUsed()
  watchLeft.value = watchAvailable()
})

// ===== 家长临时解锁（临时放行，不等于关闭锁定） =====
const TEMP_OPTS = [5, 10, 15, 30, 60, 120]
const tempOpen = ref(false)
const tempStep = ref('pin')
const tempPin = ref('')
const tempErr = ref('')
const tempMin = ref(15)
const tempCustom = ref('')
let tempBusy = false

const tempText = computed(() => {
  const m = tempCustom.value ? Number(tempCustom.value) : tempMin.value
  if (!m || m <= 0) return '自定义'
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const r = m % 60
    return r ? `${h} 小时 ${r} 分` : `${h} 小时`
  }
  return `${m} 分钟`
})

async function openTemp() {
  const cfg = await getConfig()
  const on = await isEnabled()
  if (!on || !cfg || !cfg.pinHash) {
    uni.showToast({ title: '请先到设置里开启专注锁定并设置密码', icon: 'none' })
    return
  }
  tempStep.value = 'pin'
  tempPin.value = ''
  tempErr.value = ''
  tempCustom.value = ''
  tempMin.value = 15
  tempOpen.value = true
}

async function tempPinOk() {
  if (tempBusy) return
  const left = lockoutLeft()
  if (left > 0) {
    tempErr.value = `错太多次了，${Math.ceil(left / 1000)} 秒后再试`
    return
  }
  tempBusy = true
  try {
    const cfg = await getConfig()
    if (await verifyPin(cfg, tempPin.value)) {
      resetAttempts()
      tempPin.value = ''
      tempErr.value = ''
      tempStep.value = 'time'
    } else {
      addWrongAttempt()
      const l2 = lockoutLeft()
      tempErr.value = l2 > 0 ? '连错 5 次，锁定 5 分钟' : '密码不对，再想想'
      tempPin.value = ''
    }
  } finally {
    tempBusy = false
  }
}

function pickTemp(m) {
  tempMin.value = m
  tempCustom.value = ''
}

async function tempConfirm() {
  const m = tempCustom.value ? Math.floor(Number(tempCustom.value)) : tempMin.value
  if (!m || m < 1) {
    uni.showToast({ title: '请选择或输入时长', icon: 'none' })
    return
  }
  if (m > 720) {
    uni.showToast({ title: '最长 12 小时', icon: 'none' })
    return
  }
  tempOpen.value = false
  // 临时暂停自动拉回并回桌面，到点后锁定自动恢复（不扣孩子观看时间）
  await startUnlock(m)
}

function editNick() {  uni.showModal({
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
  if (gated.value) return
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

/* ===== 家长门禁遮罩 ===== */
.gate {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: #fff9f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 80rpx;
}
.gate-icon {
  font-size: 90rpx;
}
.gate-title {
  margin-top: 20rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: #4a3f35;
}
.gate-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #a79c92;
}
.gate-input {
  margin-top: 40rpx;
  width: 100%;
  box-sizing: border-box;
  height: 96rpx;
  background: #fff;
  border: 3rpx solid #eadfce;
  border-radius: 24rpx;
  text-align: center;
  font-size: 40rpx;
  letter-spacing: 12rpx;
  font-weight: 700;
  color: #4a3f35;
}
.gate-err {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #e05a4e;
}
.gate-btn {
  margin-top: 36rpx;
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  background: linear-gradient(135deg, #ff9a5c 0%, #ff7a3d 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 800;
  border-radius: 100rpx;
  box-shadow: 0 12rpx 28rpx rgba(255, 122, 61, 0.3);
}
.gate-sub {
  margin-top: 18rpx;
  font-size: 22rpx;
  color: #b7a99b;
  line-height: 1.5;
  text-align: center;
}
.gate-cancel {
  margin-top: 22rpx;
  font-size: 26rpx;
  color: #a08f80;
}
.temp-pills {
  margin-top: 30rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  justify-content: center;
}
.temp-pill {
  padding: 0 26rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 100rpx;
  background: #fff3e8;
  color: #8a7a6d;
  font-size: 27rpx;
  font-weight: 700;
}
.temp-pill.active {
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
}
.temp-custom {
  margin-top: 22rpx;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #fff8f1;
  border: 2rpx solid #ffe3cd;
  border-radius: 18rpx;
  padding: 0 20rpx;
  height: 84rpx;
}
.temp-custom-label {
  font-size: 26rpx;
  color: #8a7a6d;
  font-weight: 700;
}
.temp-custom-input {
  flex: 1;
  font-size: 30rpx;
  color: #332c26;
  text-align: center;
}
.temp-custom-unit {
  font-size: 26rpx;
  color: #8a7a6d;
  font-weight: 700;
}
</style>
