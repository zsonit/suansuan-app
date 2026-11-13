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
          <text class="row-title">音效</text>
          <text class="row-desc">答对、答错、游戏里的提示音</text>
        </view>
        <switch :checked="settings.sound" color="#FF7A3D" @change="onSound" />
      </view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">语音鼓励</text>
          <text class="row-desc">连对时夸一夸，结算时来一句加油</text>
        </view>
        <switch :checked="settings.voice" color="#FF7A3D" @change="onVoice" />
      </view>
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
      <view class="group-title">专注锁定 · 家长控制</view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">自动拉回练习界面</text>
          <text class="row-desc">开启后无论退到桌面还是其他应用，都会自动回到算算星球，关闭需要密码</text>
        </view>
        <switch :checked="kioskOn" color="#FF7A3D" @change="onKiosk" />
      </view>
      <view class="row" v-if="kioskOn && !serviceOn" @click="goA11y">
        <view class="row-main">
          <text class="row-title warn">⚠ 无障碍服务未开启</text>
          <text class="row-desc">点这里去系统设置，开启「算算星球 · 专注锁定」后才会生效</text>
        </view>
        <text class="row-chev">›</text>
      </view>
      <view class="row" v-if="kioskOn" @click="openUnlock('reset')">
        <view class="row-main">
          <text class="row-title">修改密码 / 关闭锁定</text>
          <text class="row-desc">需要输入锁定密码，忘记密码可用恢复码或安全问题找回</text>
        </view>
        <text class="row-chev">›</text>
      </view>
    </view>

    <view class="group">
      <view class="group-title">先学再看 · 答题解锁观看时间</view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">答题解锁观看时间</text>
          <text class="row-desc">题目按年级随机出，孩子不能挑简单卡；做多少题换多少时间，到点自动拉回</text>
        </view>
        <switch :checked="watchRules.on" color="#FF7A3D" @change="onWatchSwitch" />
      </view>
      <template v-if="watchRules.on">
        <view class="row">
          <view class="row-main">
            <text class="row-title">📅 每日任务</text>
            <text class="row-desc">每天 {{ watchRules.dailyQ || 30 }} 道题换 {{ watchRules.dailyMin || 30 }} 分钟，每天只能完成一次，跨天重置</text>
          </view>
        </view>
        <view class="row">
          <view class="row-main">
            <text class="row-title">🏆 挑战赛</text>
            <text class="row-desc">前 {{ watchRules.chalQ || 20 }} 道题换 {{ watchRules.chalMin || 30 }} 分钟；之后每做一道题 +{{ watchRules.perQ || 1 }} 分钟，不限次数，可随时退出去看</text>
          </view>
        </view>
        <view class="row">
          <view class="row-main">
            <text class="row-title">⏰ 时间到强制挑战</text>
            <text class="row-desc">观看时间用完被拉回后，强制做 10 道题才能继续看，做完可接着挑战赚时间</text>
          </view>
        </view>
      </template>
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

    <!-- 专注锁定弹层 -->
    <view class="mask" v-if="overlay" @click.self="cancelOverlay">
      <view class="sheet">
        <!-- ====== 设置流程 ====== -->
        <template v-if="overlay === 'setup'">
          <text class="sheet-title">{{ kioskOn ? '修改锁定密码' : '开启专注锁定' }}</text>

          <template v-if="setupStep === 1">
            <text class="sheet-desc">设置一个 6 位数字的锁定密码</text>
            <input class="pin-input" type="number" :password="true" maxlength="6" v-model="pin1" placeholder="6 位数字密码" />
            <view class="sheet-btns">
              <view class="sbtn ghost" @click="cancelOverlay">取消</view>
              <view class="sbtn" @click="setupNext">下一步</view>
            </view>
          </template>

          <template v-else-if="setupStep === 2">
            <text class="sheet-desc">再输一次确认</text>
            <input class="pin-input" type="number" :password="true" maxlength="6" v-model="pin2" placeholder="再次输入密码" />
            <view class="sheet-btns">
              <view class="sbtn ghost" @click="setupStep = 1">上一步</view>
              <view class="sbtn" @click="setupNext">下一步</view>
            </view>
          </template>

          <template v-else>
            <text class="sheet-desc">设置找回方式（忘记密码时用）：</text>
            <view class="q-list">
              <view
                v-for="q in QUESTIONS"
                :key="q"
                class="q-item"
                :class="{ active: secQ === q }"
                @click="secQ = q"
              >
                {{ q }}
              </view>
            </view>
            <input class="pin-input" v-model="secA" placeholder="安全问题答案" />
            <input class="pin-input" type="number" maxlength="11" v-model="phoneIn" placeholder="自己的手机号（11 位，用于找回）" />
            <text class="err" v-if="setupErr">{{ setupErr }}</text>
            <view class="sheet-btns">
              <view class="sbtn ghost" @click="setupStep = 2">上一步</view>
              <view class="sbtn" @click="setupNext">确认开启</view>
            </view>
          </template>
        </template>

        <!-- ====== 解锁流程 ====== -->
        <template v-else-if="overlay === 'unlock'">
          <text class="sheet-title">{{ unlockPurpose === 'enable' ? '输入密码开启' : unlockPurpose === 'watch' ? '输入密码修改规则' : unlockPurpose === 'reset' ? '修改密码 / 关闭锁定' : '关闭专注锁定' }}</text>

          <template v-if="!forgotMode">
            <text class="sheet-desc">输入锁定密码</text>
            <input class="pin-input" type="number" :password="true" maxlength="6" v-model="unlockPin" placeholder="锁定密码" @confirm="submitUnlock" />
            <text class="err" v-if="unlockErr">{{ unlockErr }}</text>
            <view class="sheet-btns">
              <view class="sbtn ghost" @click="cancelOverlay">取消</view>
              <view class="sbtn" @click="submitUnlock">确定</view>
            </view>
            <view class="link" @click="forgotMode = 'choose'">忘记密码？</view>
          </template>

          <template v-else-if="forgotMode === 'choose'">
            <text class="sheet-desc">选择找回方式</text>
            <view class="sheet-btns col">
              <view class="sbtn" @click="forgotMode = 'recovery'">用手机号找回</view>
              <view class="sbtn" @click="forgotMode = 'answer'">回答安全问题</view>
            </view>
            <view class="link" @click="forgotMode = null">返回输密码</view>
          </template>

          <template v-else-if="forgotMode === 'recovery'">
            <text class="sheet-desc">输入开启锁定时设置的手机号</text>
            <input class="pin-input" type="number" maxlength="11" v-model="recoveryIn" placeholder="手机号码" />
            <text class="err" v-if="unlockErr">{{ unlockErr }}</text>
            <view class="sheet-btns">
              <view class="sbtn ghost" @click="forgotMode = 'choose'">返回</view>
              <view class="sbtn" @click="submitRecovery">验证</view>
            </view>
          </template>

          <template v-else-if="forgotMode === 'answer'">
            <text class="sheet-desc">{{ cfg && cfg.question }}</text>
            <input class="pin-input" v-model="answerIn" placeholder="答案" />
            <text class="err" v-if="unlockErr">{{ unlockErr }}</text>
            <view class="sheet-btns">
              <view class="sbtn ghost" @click="forgotMode = 'choose'">返回</view>
              <view class="sbtn" @click="submitAnswer">验证</view>
            </view>
          </template>

          <template v-else-if="forgotMode === 'verified'">
            <text class="sheet-desc">✅ 身份验证通过，可以重置密码或直接关闭锁定</text>
            <view class="sheet-btns col">
              <view class="sbtn" @click="startResetFromForgot">重置密码</view>
              <view class="sbtn danger" @click="disableKiosk">关闭锁定</view>
            </view>
          </template>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSettings, saveSettings, clearAll, getWatchRules, saveWatchRules } from '@/common/store'
import { sfx, speak } from '@/common/sound'
import {
  QUESTIONS, getConfig, saveConfig, setEnabled, isEnabled, isServiceOn,
  openAccessibilitySettings, verifyPin, verifyAnswer, verifyPhone,
  sha256, lockoutLeft, addWrongAttempt, resetAttempts
} from '@/common/kiosk'

const goals = [10, 20, 30, 50]
const settings = ref(getSettings())
const eyeCare = computed(() => settings.value.eyeCare)

// ===== 专注锁定 =====
const kioskOn = ref(false)
const serviceOn = ref(false)
const cfg = ref(null)
const overlay = ref(null) // null | 'setup' | 'unlock'
const setupStep = ref(1)
const setupErr = ref('')
const pin1 = ref('')
const pin2 = ref('')
const secQ = ref(QUESTIONS[0])
const secA = ref('')
const phoneIn = ref('')
const unlockPurpose = ref('disable') // enable | disable | reset
const unlockPin = ref('')
const unlockErr = ref('')
const forgotMode = ref(null) // null | choose | recovery | answer | verified
const recoveryIn = ref('')
const answerIn = ref('')

onShow(async () => {
  settings.value = getSettings()
  kioskOn.value = await isEnabled()
  serviceOn.value = await isServiceOn()
  cfg.value = await getConfig()
})

function setGoal(g) {
  settings.value = saveSettings({ dailyGoal: g })
}

function onAutoNext(e) {
  settings.value = saveSettings({ autoNext: e.detail.value })
}
function onSound(e) {
  settings.value = saveSettings({ sound: e.detail.value })
  if (e.detail.value) sfx('right') // 打开时给一声试听
}
function onVoice(e) {
  settings.value = saveSettings({ voice: e.detail.value })
  if (e.detail.value) speak('语音鼓励已开启')
}
function onHaptic(e) {
  settings.value = saveSettings({ haptic: e.detail.value })
}
function onEyeCare(e) {
  settings.value = saveSettings({ eyeCare: e.detail.value })
}

// ===== 先学再看规则 =====
const watchRules = ref(getWatchRules())
// 开启锁定时改规则需验证密码（防孩子自己改）
let watchPending = null

function onWatchSwitch(e) {
  const val = !!e.detail.value
  if (kioskOn.value && cfg.value && cfg.value.pinHash) {
    watchPending = { on: val }
    unlockPurpose.value = 'watch'
    overlay.value = 'unlock'
    forgotMode.value = null
    unlockPin.value = ''
    unlockErr.value = ''
    setTimeout(refreshKiosk, 0)
    return
  }
  watchRules.value = saveWatchRules({ on: val })
}

function setWatch(field, val) {
  if (kioskOn.value && cfg.value && cfg.value.pinHash) {
    watchPending = { [field]: val }
    unlockPurpose.value = 'watch'
    overlay.value = 'unlock'
    forgotMode.value = null
    unlockPin.value = ''
    unlockErr.value = ''
    setTimeout(refreshKiosk, 0)
    return
  }
  watchRules.value = saveWatchRules({ [field]: val })
}

function applyWatchPending() {
  if (!watchPending) return
  watchRules.value = saveWatchRules(watchPending)
  watchPending = null
  uni.showToast({ title: '已更新', icon: 'success' })
}

// ===== 专注锁定逻辑 =====
async function refreshKiosk() {
  kioskOn.value = await isEnabled()
  serviceOn.value = await isServiceOn()
  cfg.value = await getConfig()
}

async function onKiosk(e) {
  const val = !!e.detail.value
  if (val) {
    // 开启：已有密码配置则先验证密码，否则走设置流程
    const c = await getConfig()
    if (c && c.pinHash) {
      unlockPurpose.value = 'enable'
      overlay.value = 'unlock'
      forgotMode.value = null
      unlockPin.value = ''
      unlockErr.value = ''
    } else {
      startSetup()
    }
  } else {
    unlockPurpose.value = 'disable'
    overlay.value = 'unlock'
    forgotMode.value = null
    unlockPin.value = ''
    unlockErr.value = ''
  }
  // switch 显示状态以 kioskOn 为准，先弹回去
  setTimeout(refreshKiosk, 0)
}

function startSetup() {
  overlay.value = 'setup'
  setupStep.value = 1
  setupErr.value = ''
  pin1.value = ''
  pin2.value = ''
  secQ.value = QUESTIONS[0]
  secA.value = ''
  phoneIn.value = ''
}

async function setupNext() {
  if (setupStep.value === 1) {
    if (!/^\d{6}$/.test(pin1.value)) {
      uni.showToast({ title: '请输入 6 位数字密码', icon: 'none' })
      return
    }
    setupStep.value = 2
    return
  }
  if (setupStep.value === 2) {
    if (pin1.value !== pin2.value) {
      uni.showToast({ title: '两次输入不一致', icon: 'none' })
      return
    }
    setupStep.value = 3
    return
  }
  // 第 3 步：安全问题 + 手机号
  if (!secA.value.trim()) {
    setupErr.value = '请填写安全问题答案'
    return
  }
  if (!/^1\d{10}$/.test(phoneIn.value.replace(/\D/g, ''))) {
    setupErr.value = '请输入 11 位手机号码'
    return
  }
  setupErr.value = ''
  finishSetup()
}

async function finishSetup() {
  const c = cfg.value || {}
  const salt = c.salt || String(Date.now()) + Math.random().toString(36).slice(2)
  const newCfg = {
    salt,
    pinHash: await sha256(salt + ':' + pin1.value),
    question: secQ.value,
    ansHash: await sha256(salt + ':a:' + secA.value.trim().toLowerCase()),
    phoneHash: await sha256(salt + ':p:' + phoneIn.value.replace(/\D/g, ''))
  }
  await saveConfig(newCfg)
  cfg.value = newCfg
  await setEnabled(true)
  kioskOn.value = true
  overlay.value = null
  uni.showToast({ title: '已开启', icon: 'success' })
  setTimeout(async () => {
    serviceOn.value = await isServiceOn()
    if (!serviceOn.value) {
      uni.showModal({
        title: '还差一步',
        content: '需要在系统设置里开启「算算星球 · 专注锁定」无障碍服务才会生效，现在去开启吗？',
        confirmText: '去开启',
        success: (r) => {
          if (r.confirm) goA11y()
        }
      })
    }
  }, 300)
}

async function goA11y() {
  await openAccessibilitySettings()
}

function openUnlock(purpose) {
  unlockPurpose.value = purpose
  overlay.value = 'unlock'
  forgotMode.value = null
  unlockPin.value = ''
  unlockErr.value = ''
  recoveryIn.value = ''
  answerIn.value = ''
  resetAttempts()
}

function cancelOverlay() {
  overlay.value = null
  refreshKiosk()
}

async function submitUnlock() {
  const left = lockoutLeft()
  if (left > 0) {
    unlockErr.value = '错误次数过多，请 ' + Math.ceil(left / 60000) + ' 分钟后再试'
    return
  }
  const c = cfg.value
  if (!c) {
    unlockErr.value = '未找到密码配置'
    return
  }
  if (!(await verifyPin(c, unlockPin.value))) {
    const n = addWrongAttempt()
    unlockErr.value = n >= 5 ? '错误次数过多，已锁定 5 分钟' : '密码不对（第 ' + n + ' 次错误）'
    unlockPin.value = ''
    return
  }
  resetAttempts()
  applyUnlock()
}

async function submitRecovery() {
  const c = cfg.value
  if (!c || !(await verifyPhone(c, recoveryIn.value))) {
    unlockErr.value = '手机号不对'
    recoveryIn.value = ''
    return
  }
  forgotMode.value = 'verified'
  unlockErr.value = ''
}

async function submitAnswer() {
  const c = cfg.value
  if (!c) return
  if (!(await verifyAnswer(c, answerIn.value))) {
    unlockErr.value = '答案不对'
    answerIn.value = ''
    return
  }
  forgotMode.value = 'verified'
  unlockErr.value = ''
}

function applyUnlock() {
  if (unlockPurpose.value === 'enable') {
    setEnabled(true).then(async () => {
      kioskOn.value = true
      overlay.value = null
      uni.showToast({ title: '已开启', icon: 'success' })
      serviceOn.value = await isServiceOn()
      if (!serviceOn.value) goA11y()
    })
  } else if (unlockPurpose.value === 'reset') {
    startSetup()
  } else if (unlockPurpose.value === 'watch') {
    applyWatchPending()
    overlay.value = null
  } else {
    disableKiosk()
  }
}

async function disableKiosk() {
  await setEnabled(false)
  kioskOn.value = false
  overlay.value = null
  uni.showToast({ title: '已关闭锁定', icon: 'success' })
}

function startResetFromForgot() {
  // 验证通过后重置：保留原 salt 语义由 finishSetup 处理，走全新设置流程
  forgotMode.value = null
  unlockPurpose.value = 'reset'
  startSetup()
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
  padding-top: calc(max(env(safe-area-inset-top), var(--status-bar-height, 0px)) + 16rpx);
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

.row-title.warn {
  color: #e67e22;
}

/* ===== 专注锁定弹层 ===== */
.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(51, 44, 38, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  padding: 40rpx;
}
.sheet {
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 36rpx;
  padding: 44rpx 40rpx 36rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.sheet-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #332c26;
  margin-bottom: 18rpx;
}
.sheet-desc {
  font-size: 25rpx;
  color: #6d6157;
  line-height: 1.6;
  margin-bottom: 22rpx;
}
.pin-input {
  height: 96rpx;
  background: #f8f1e8;
  border-radius: 24rpx;
  padding: 0 28rpx;
  font-size: 34rpx;
  letter-spacing: 6rpx;
  color: #332c26;
  margin-bottom: 26rpx;
}
.err {
  font-size: 23rpx;
  color: #ff6b6b;
  margin: -12rpx 0 18rpx;
}
.sheet-btns {
  display: flex;
  gap: 18rpx;
}
.sheet-btns.col {
  flex-direction: column;
  gap: 16rpx;
}
.sbtn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
  font-size: 29rpx;
  font-weight: 700;
  border-radius: 24rpx;
}
.sbtn.ghost {
  background: #f8f1e8;
  color: #6d6157;
}
.sbtn.danger {
  background: #ff6b6b;
}
.q-list {
  margin-bottom: 20rpx;
}
.q-item {
  padding: 20rpx 24rpx;
  background: #f8f1e8;
  border-radius: 20rpx;
  font-size: 25rpx;
  color: #6d6157;
  margin-bottom: 14rpx;
  border: 3rpx solid transparent;
}
.q-item.active {
  background: #fff6ee;
  border-color: #ff7a3d;
  color: #332c26;
  font-weight: 600;
}
.link {
  margin-top: 20rpx;
  text-align: center;
  font-size: 25rpx;
  color: #ff7a3d;
}

.mini-pills {
  display: flex;
  gap: 10rpx;
}
.mpill {
  padding: 0 20rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 23rpx;
  font-weight: 600;
  color: #6d6157;
  background: #f8f1e8;
  border-radius: 100rpx;
}
.mpill.active {
  background: #332c26;
  color: #fff;
}
</style>
