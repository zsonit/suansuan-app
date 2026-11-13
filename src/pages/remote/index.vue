<template>
  <view class="page">
    <view class="nav">
      <text class="back" @click="goBack">‹</text>
      <text class="nav-title">家长远程控制</text>
    </view>

    <!-- 绑定新设备 -->
    <view class="card">
      <view class="group-title">绑定孩子的设备</view>
      <view class="bind-row">
        <input class="bind-input" v-model="codeIn" maxlength="8" placeholder="输入 8 位配对码" />
        <view class="bind-btn" @click="bind">绑定</view>
      </view>
      <text class="bind-err" v-if="bindErr">{{ bindErr }}</text>
      <text class="bind-tip">配对码在孩子的设备：设置 → 家长远程控制；一次绑定永久有效，可绑定多台设备</text>
    </view>

    <!-- 设备列表 -->
    <view class="card" v-for="d in devices" :key="d.code">
      <view class="dev-head">
        <text class="dev-name">{{ d.name || '孩子的设备' }}</text>
        <text class="dev-dot" :class="{ on: d.online }">{{ d.online ? '● 在线' : '○ 离线' }}</text>
        <text class="dev-del" @click="unbind(d.code)">删除</text>
      </view>

      <!-- 使用情况 -->
      <view class="stats" v-if="d.info && d.info.state">
        <view class="stat">
          <text class="stat-num">{{ (d.info.state && d.info.state.avail) || 0 }}</text>
          <text class="stat-label">还能用(分)</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ (d.info.state && d.info.state.dailyDone) || 0 }}/30</text>
          <text class="stat-label">今日任务</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ (d.info.state && d.info.state.chalDone) || 0 }}</text>
          <text class="stat-label">累计挑战题</text>
        </view>
      </view>
      <text class="dev-tip" v-if="d.info && !d.online && d.info.online_at">最后在线：{{ fmtTime(d.info.online_at) }}</text>

      <!-- 控制按钮 -->
      <view class="ctl-row">
        <text class="ctl-label">临时解锁</text>
        <view class="pills">
          <view class="pill" v-for="m in [5, 10, 15, 30, 60]" :key="m" @click="unlock(d, m)">{{ m >= 60 ? (m / 60) + '时' : m + '分' }}</view>
        </view>
      </view>
      <view class="ctl-row">
        <text class="ctl-label">立即锁定</text>
        <view class="pills">
          <view class="pill danger" @click="lockNow(d)">马上拉回</view>
          <view class="pill" @click="ping(d)">测试连接</view>
        </view>
      </view>

      <!-- 留言 -->
      <view class="msg-row">
        <input class="bind-input" v-model="d.msgText" placeholder="给孩子发条消息，如：该写作业了" />
        <view class="bind-btn" @click="sendMsg(d)">发送</view>
      </view>

      <!-- 规则修改 -->
      <view class="ctl-row" @click="toggleRules(d)">
        <text class="ctl-label">规则与年级</text>
        <text class="ctl-chev">{{ d.showRules ? '收起 ▴' : '展开 ▾' }}</text>
      </view>
      <view class="rules" v-if="d.showRules">
        <view class="rule-line" v-if="d.rules">
          <text class="rule-txt">每日任务：{{ d.rules.dailyQ || 30 }} 题换 {{ d.rules.dailyMin || 30 }} 分钟 · 挑战赛：{{ d.rules.chalQ || 20 }} 题换 {{ d.rules.chalMin || 30 }} 分钟 · 之后每题 +{{ d.rules.perQ || 1 }} 分钟 · 功能{{ d.rules.on ? '已开启' : '已关闭' }}</text>
        </view>
        <view class="rule-pills" v-if="d.rules">
          <view class="pill" :class="{ active: d.rules.on }" @click="setRule(d, 'on', !d.rules.on)">{{ d.rules.on ? '关闭功能' : '开启功能' }}</view>
          <view class="pill" :class="{ active: d.rules.dailyQ === 30 }" @click="setRule(d, 'dailyQ', 30)">每日30题</view>
          <view class="pill" :class="{ active: d.rules.dailyQ === 20 }" @click="setRule(d, 'dailyQ', 20)">每日20题</view>
          <view class="pill" :class="{ active: d.rules.chalQ === 20 }" @click="setRule(d, 'chalQ', 20)">挑战20题</view>
          <view class="pill" :class="{ active: d.rules.chalQ === 30 }" @click="setRule(d, 'chalQ', 30)">挑战30题</view>
        </view>
        <view class="rule-pills">
          <view class="pill" :class="{ active: d.grade === 0 }" @click="setGrade(d, 0)">全年级</view>
          <view
            v-for="g in GRADES"
            :key="g.key"
            class="pill"
            :class="{ active: d.grade === g.key }"
            @click="setGrade(d, g.key)"
          >
            {{ g.name }}
          </view>
        </view>
        <text class="bind-tip">修改后孩子设备 6 秒内自动生效</text>
      </view>
    </view>

    <!-- 做题报告 -->
    <view class="card" v-for="d in devices" :key="'r' + d.code" v-show="d.online !== undefined">
      <view class="group-title">{{ d.name || '孩子的设备' }} · 做题报告</view>
      <view class="rep" v-for="r in d.reports" :key="r.id">
        <view class="rep-head">
          <text class="rep-time">{{ fmtTime(r.created_at) }}</text>
          <text class="rep-acc" :class="{ good: acc(r) >= 80 }">{{ r.data.total ? Math.round((r.data.right / r.data.total) * 100) : 0 }}% · {{ r.data.right }}/{{ r.data.total }}题</text>
        </view>
        <text class="rep-wrong" v-for="(w, i) in r.data.wrong || []" :key="i">
          ✗ {{ w.text }} · 答了「{{ w.your }}」，正确是「{{ w.answer }}」
        </text>
        <text class="rep-ok" v-if="!(r.data.wrong || []).length">全对，没有错题 🎉</text>
      </view>
      <text class="bind-tip" v-if="d.reports && !d.reports.length">还没有做题报告，孩子做完一组题后会自动同步</text>
    </view>

    <view style="height: 60rpx"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { GRADES } from '@/common/questions'
import {
  parentListBound, parentBind, parentUnbind, parentSend,
  parentFetchDevice, parentFetchReports
} from '@/common/remote'
import { sfx } from '@/common/sound'

const codeIn = ref('')
const bindErr = ref('')
const devices = ref([])

onShow(() => {
  loadDevices()
})

async function loadDevices() {
  const bound = parentListBound()
  devices.value = await Promise.all(
    bound.map(async (d) => {
      const old = devices.value.find((x) => x.code === d.code) || {}
      const dev = {
        code: d.code,
        name: old.name && old.name !== '孩子的设备' ? old.name : d.name,
        msgText: old.msgText || '',
        showRules: old.showRules || false,
        rules: old.rules || null,
        grade: old.grade,
        info: old.info || null,
        reports: old.reports || []
      }
      try {
        const info = await parentFetchDevice(d.code)
        if (info) {
          dev.info = info
          dev.name = info.name || dev.name
          dev.online = info.online
          if (info.state) {
            dev.grade = info.state.grade
            if (info.state.rules) dev.rules = info.state.rules
          }
        }
      } catch (e) { /* 网络异常保留旧数据 */ }
      try {
        dev.reports = await parentFetchReports(d.code, 10)
      } catch (e) { /* 静默 */ }
      return dev
    })
  )
}

async function bind() {
  bindErr.value = ''
  sfx('tap')
  try {
    await parentBind(codeIn.value)
    codeIn.value = ''
    loadDevices()
  } catch (e) {
    bindErr.value = e.message || '绑定失败'
  }
}

function unbind(code) {
  uni.showModal({
    title: '解除绑定',
    content: '确定不再控制这台设备吗？',
    success: (r) => {
      if (r.confirm) {
        parentUnbind(code)
        loadDevices()
      }
    }
  })
}

async function unlock(d, minutes) {
  sfx('tap')
  try {
    await parentSend(d.code, 'unlock', { minutes })
    toast(`已下发：临时解锁 ${minutes >= 60 ? minutes / 60 + ' 小时' : minutes + ' 分钟'}`)
  } catch (e) {
    toast(e.message || '发送失败')
  }
}

async function lockNow(d) {
  sfx('tap')
  try {
    await parentSend(d.code, 'lock_now', {})
    toast('已下发：立即锁定并拉回')
  } catch (e) {
    toast(e.message || '发送失败')
  }
}

async function ping(d) {
  sfx('tap')
  try {
    await parentSend(d.code, 'ping', {})
    toast('已发送测试，几秒后设备状态会刷新')
  } catch (e) {
    toast(e.message || '发送失败')
  }
}

async function sendMsg(d) {
  const text = (d.msgText || '').trim()
  if (!text) return toast('先写点什么吧')
  sfx('tap')
  try {
    await parentSend(d.code, 'msg', { text })
    d.msgText = ''
    toast('消息已发送')
  } catch (e) {
    toast(e.message || '发送失败')
  }
}

function toggleRules(d) {
  d.showRules = !d.showRules
  if (d.showRules && !d.rules) {
    // 没拉到孩子端规则时先给默认值，下次状态刷新会覆盖为真实值
    d.rules = { on: true, dailyQ: 30, dailyMin: 30, chalQ: 20, chalMin: 30, perQ: 1 }
  }
}

async function setRule(d, key, value) {
  sfx('tap')
  d.rules = Object.assign({}, d.rules, { [key]: value })
  try {
    await parentSend(d.code, 'set_rules', { rules: d.rules })
    toast('规则已更新')
  } catch (e) {
    toast(e.message || '发送失败')
  }
}

async function setGrade(d, g) {
  sfx('tap')
  d.grade = g
  try {
    await parentSend(d.code, 'set_grade', { grade: g })
    toast('年级已更新')
  } catch (e) {
    toast(e.message || '发送失败')
  }
}

function acc(r) {
  return r.data.total ? Math.round((r.data.right / r.data.total) * 100) : 0
}

function fmtTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (d.toDateString() === now.toDateString()) return '今天 ' + hm
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`
}

function toast(title) {
  uni.showToast({ title, icon: 'none' })
}

function goBack() {
  uni.navigateBack()
}
</script>

<style>
.page {
  min-height: 100vh;
  background: #fff9f0;
  padding: 0 28rpx 40rpx;
}

.nav {
  display: flex;
  align-items: center;
  padding: 90rpx 0 20rpx;
}

.back {
  font-size: 52rpx;
  color: #6b5a4a;
  padding: 0 20rpx 0 0;
}

.nav-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #332c26;
}

.card {
  background: #fffdf9;
  border: 2rpx solid #f4e9db;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-top: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(120, 80, 40, 0.06);
}

.group-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #332c26;
  margin-bottom: 20rpx;
}

.bind-row,
.msg-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 12rpx;
}

.bind-input {
  flex: 1;
  height: 84rpx;
  background: #fff;
  border: 2rpx solid #f0e4d5;
  border-radius: 20rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #332c26;
}

.bind-btn {
  padding: 0 36rpx;
  height: 84rpx;
  line-height: 84rpx;
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
  font-size: 29rpx;
  font-weight: 800;
  border-radius: 20rpx;
}

.bind-err {
  display: block;
  color: #ff6b6b;
  font-size: 26rpx;
  margin: 8rpx 0;
}

.bind-tip {
  display: block;
  font-size: 22rpx;
  color: #c0b3a6;
  margin-top: 10rpx;
  line-height: 1.6;
}

.dev-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.dev-name {
  font-size: 32rpx;
  font-weight: 800;
  color: #332c26;
  flex: 1;
}

.dev-dot {
  font-size: 24rpx;
  color: #c0b3a6;
}

.dev-dot.on {
  color: #2fbf87;
}

.dev-del {
  font-size: 24rpx;
  color: #ff6b6b;
  padding: 6rpx 12rpx;
}

.dev-tip {
  display: block;
  font-size: 22rpx;
  color: #c0b3a6;
  margin-bottom: 8rpx;
}

.stats {
  display: flex;
  background: #fff4e8;
  border-radius: 20rpx;
  padding: 20rpx 0;
  margin-bottom: 18rpx;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 800;
  color: #ff7a3d;
}

.stat-label {
  font-size: 21rpx;
  color: #a08c78;
}

.ctl-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-top: 2rpx solid #f8f1e8;
}

.ctl-label {
  width: 150rpx;
  font-size: 27rpx;
  font-weight: 700;
  color: #6b5a4a;
}

.ctl-chev {
  font-size: 26rpx;
  color: #c0b3a6;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.pill {
  padding: 10rpx 24rpx;
  background: #fff;
  border: 2rpx solid #f0e4d5;
  border-radius: 100rpx;
  font-size: 25rpx;
  color: #6b5a4a;
  font-weight: 700;
}

.pill.active {
  background: #ff7a3d;
  border-color: #ff7a3d;
  color: #fff;
}

.pill.danger {
  background: #fff0ef;
  border-color: #ffd4d1;
  color: #ff6b6b;
}

.rules {
  padding: 8rpx 0 4rpx 166rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.rule-txt {
  font-size: 23rpx;
  color: #a08c78;
  line-height: 1.6;
}

.rep {
  padding: 16rpx 0;
  border-top: 2rpx solid #f8f1e8;
}

.rep:first-of-type {
  border-top: none;
}

.rep-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.rep-time {
  font-size: 25rpx;
  color: #6b5a4a;
  font-weight: 700;
}

.rep-acc {
  font-size: 25rpx;
  color: #ff6b6b;
  font-weight: 800;
}

.rep-acc.good {
  color: #2fbf87;
}

.rep-wrong {
  display: block;
  font-size: 23rpx;
  color: #8a7663;
  line-height: 1.7;
}

.rep-ok {
  display: block;
  font-size: 23rpx;
  color: #2fbf87;
}
</style>
