<template>
  <view class="page">
    <view class="hd">
      <view class="hd-row">
        <view class="back" @click="back">‹</view>
        <view class="hd-title devt">{{ dev.name || '孩子设备' }}</view>
        <view class="icon-btn" :class="{ spin: loading }" @click="load(true)">⟳</view>
      </view>
      <view class="hd-sub">
        <text class="dot" :class="{ on: dev.online }"></text>
        {{ dev.online ? '设备在线，指令秒级生效' : onlineText(dev.onlineAt) }}
        <text class="code">配对码 {{ code }}</text>
      </view>
    </view>

    <!-- 概览 -->
    <view class="card">
      <view class="grid">
        <view class="g">
          <text class="gnum">{{ st.avail || 0 }}</text>
          <text class="glbl">还能用(分)</text>
        </view>
        <view class="g">
          <text class="gnum">{{ st.watchUsed || 0 }}</text>
          <text class="glbl">今日已用(分)</text>
        </view>
        <view class="g">
          <text class="gnum">{{ st.dailyDone || 0 }}<text class="gs">/{{ rules.dailyQ }}</text></text>
          <text class="glbl">今日任务</text>
        </view>
        <view class="g">
          <text class="gnum">{{ st.chalDone || 0 }}</text>
          <text class="glbl">挑战题数</text>
        </view>
      </view>
    </view>

    <!-- 临时解锁 -->
    <view class="card">
      <view class="card-t">
        <text>临时解锁</text>
        <text class="hint">不扣孩子时间</text>
      </view>
      <view class="pills">
        <view
          v-for="m in MINUTES"
          :key="m"
          class="pill"
          @click="doUnlock(m)"
        >{{ m >= 60 ? m / 60 + ' 小时' : m + ' 分钟' }}</view>
      </view>
      <view class="row2">
        <input
          class="ipt"
          type="number"
          v-model="customMin"
          placeholder="自定义分钟数（1~720）"
          placeholder-class="ph"
        />
        <view class="btn sm" @click="doUnlock(Number(customMin))">解锁</view>
      </view>
    </view>

    <!-- 控制 -->
    <view class="card">
      <view class="card-t">立即控制</view>
      <view class="row2">
        <view class="btn ghost flex1" @click="doPing">测试连接</view>
        <view class="btn danger flex1" @click="doLock">立即锁定并拉回</view>
      </view>
      <view class="muted" style="margin-top: 14rpx">
        锁定会让设备立刻回到算算星球并暂停使用时间，孩子无法自行关闭（关闭需答案 + 家长密码）。
      </view>
    </view>

    <!-- 留言 -->
    <view class="card">
      <view class="card-t">
        <text>给孩子留言</text>
        <text class="hint">设备上弹窗提示</text>
      </view>
      <view class="row2">
        <input
          class="ipt"
          v-model="msgText"
          maxlength="60"
          placeholder="例如：先写完作业再看"
          placeholder-class="ph"
          @confirm="doMsg"
        />
        <view class="btn sm" @click="doMsg">发送</view>
      </view>
    </view>

    <!-- 规则 -->
    <view class="card">
      <view class="card-t">
        <text>先学再看 · 规则</text>
        <text class="hint">改完几秒内生效</text>
      </view>

      <view class="line">
        <text class="lab">专注锁定</text>
        <view class="pills inline">
          <view class="pill sm" :class="{ active: rules.on }" @click="setRule('on', true)">开启</view>
          <view class="pill sm" :class="{ active: !rules.on }" @click="setRule('on', false)">关闭</view>
        </view>
      </view>

      <view class="line">
        <text class="lab">每日题数</text>
        <view class="pills inline">
          <view
            v-for="v in [20, 30, 40]"
            :key="'dq' + v"
            class="pill sm"
            :class="{ active: rules.dailyQ === v }"
            @click="setRule('dailyQ', v)"
          >{{ v }}</view>
        </view>
      </view>

      <view class="line">
        <text class="lab">每日奖励</text>
        <view class="pills inline">
          <view
            v-for="v in [20, 30, 45, 60]"
            :key="'dm' + v"
            class="pill sm"
            :class="{ active: rules.dailyMin === v }"
            @click="setRule('dailyMin', v)"
          >{{ v }}分</view>
        </view>
      </view>

      <view class="line">
        <text class="lab">挑战门槛</text>
        <view class="pills inline">
          <view
            v-for="v in [20, 30]"
            :key="'cq' + v"
            class="pill sm"
            :class="{ active: rules.chalQ === v }"
            @click="setRule('chalQ', v)"
          >{{ v }}题</view>
        </view>
      </view>

      <view class="line">
        <text class="lab">挑战奖励</text>
        <view class="pills inline">
          <view
            v-for="v in [20, 30, 45]"
            :key="'cm' + v"
            class="pill sm"
            :class="{ active: rules.chalMin === v }"
            @click="setRule('chalMin', v)"
          >{{ v }}分</view>
        </view>
      </view>

      <view class="line">
        <text class="lab">每对一题</text>
        <view class="pills inline">
          <view
            v-for="v in [1, 2]"
            :key="'pq' + v"
            class="pill sm"
            :class="{ active: rules.perQ === v }"
            @click="setRule('perQ', v)"
          >+{{ v }}分</view>
        </view>
      </view>
    </view>

    <!-- 年级 -->
    <view class="card" :class="{ need: needGrade }">
      <view class="card-t">
        <text>题目年级</text>
        <text class="hint">设定后孩子不能改</text>
      </view>

      <view class="ask" v-if="needGrade">
        先选孩子现在读的年级 —— 选完孩子端就只能做这个年级的题，其他年级点不了
      </view>

      <view class="pills">
        <view
          v-for="(g, i) in GRADE_NAMES"
          :key="'g' + i"
          class="pill"
          :class="{ active: grade === i }"
          @click="doGrade(i)"
        >{{ g }}</view>
      </view>

      <view class="lockbar" v-if="gradeLocked">
        <text class="lk">🔒 已锁定 {{ GRADE_NAMES[grade] || '' }}</text>
        <text class="lkbtn" @click="allowChild">允许孩子自选</text>
      </view>
      <view class="lockbar" v-else>
        <text class="lk muted">未锁定：孩子可以在设备上自己换年级</text>
        <text class="lkbtn" @click="doGrade(grade)">锁定当前年级</text>
      </view>

      <view class="muted" style="margin-top: 10rpx">
        每逢 9 月 1 日新学年自动升一级（六年级封顶）{{ gradeNextUp ? '，下次升级：' + gradeNextUp : '' }}。想跳级或留级，随时在这里改。
      </view>
    </view>

    <!-- 报告 -->
    <view class="card">
      <view class="card-t">
        <text>做题报告</text>
        <text class="hint" @click="goReport">全部 ›</text>
      </view>
      <view v-if="!reports.length" class="empty">
        还没有报告{{ '\n' }}孩子做完一组题后会自动同步到这里
      </view>
      <view
        v-for="(r, i) in reports.slice(0, 3)"
        :key="'r' + i"
        class="rep"
        @click="goReport"
      >
        <view class="rephead">
          <text class="repl">{{ sessionLabel(r) }}</text>
          <text class="acc" :class="{ good: accuracy(r) >= 80 }">
            {{ accuracy(r) }}% · {{ (r.data && r.data.right) || 0 }}/{{ (r.data && r.data.total) || 0 }}题
          </text>
        </view>
        <view class="reptime">{{ fmtTime(r.created_at) }}</view>
      </view>
    </view>

    <!-- 设备 -->
    <view class="card">
      <view class="card-t">设备设置</view>
      <view class="row2">
        <input class="ipt" v-model="nameIn" maxlength="12" placeholder="设备名称，如：客厅平板" placeholder-class="ph" />
        <view class="btn sm ghost" @click="doRename">重命名</view>
      </view>
      <view class="btn danger unbind" @click="doUnbind">解除绑定（不再控制这台设备）</view>
      <view class="muted" style="margin-top: 14rpx">
        解除绑定只影响这台手机上的控制权，孩子设备的本地规则不受影响。
      </view>
    </view>
  </view>
</template>

<script>
import {
  getDevice, getReports, unlock, lockNow, ping, message, setRules, setGrade,
  renameDevice, unbind, listBound, onlineText, fmtTime, sessionLabel, accuracy,
  DEFAULT_RULES, GRADE_NAMES, toast
} from '@/common/cloud'

const MINUTES = [5, 10, 15, 30, 60, 120]

export default {
  data() {
    return {
      MINUTES,
      GRADE_NAMES,
      code: '',
      dev: { name: '', online: false, onlineAt: 0, state: {} },
      reports: [],
      rules: Object.assign({}, DEFAULT_RULES),
      grade: 1,
      gradeLocked: false,
      gradeNextUp: '',
      needGrade: false,
      loading: false,
      customMin: '',
      msgText: '',
      nameIn: '',
      timer: null
    }
  },
  computed: {
    st() {
      const s = this.dev.state || {}
      return {
        avail: Number(s.avail) || 0,
        watchUsed: Number(s.watchUsed) || 0,
        dailyDone: Number(s.dailyDone) || 0,
        chalDone: Number(s.chalDone) || 0
      }
    }
  },
  onLoad(options) {
    this.code = String((options && options.code) || '').toUpperCase()
    // 从「绑定成功」进来：提示先设年级
    this.needGrade = String((options && options.setup) || '') === '1'
    const local = listBound().find((d) => d.code === this.code)
    if (local) {
      this.dev.name = local.name || ''
      this.nameIn = local.name || ''
    }
  },
  onShow() {
    this.load(false)
    this.startTimer()
  },
  onHide() {
    this.stopTimer()
  },
  onUnload() {
    this.stopTimer()
  },
  methods: {
    onlineText,
    fmtTime,
    sessionLabel,
    accuracy,
    back() {
      uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    },
    startTimer() {
      this.stopTimer()
      this.timer = setInterval(() => this.load(false), 8000)
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    async load(manual) {
      if (!this.code) return
      if (manual) this.loading = true
      try {
        const d = await getDevice(this.code)
        if (d) {
          this.dev = d
          this.nameIn = this.nameIn || d.name || ''
          const s = d.state || {}
          if (s.rules) this.rules = Object.assign({}, DEFAULT_RULES, s.rules)
          if (s.grade !== undefined && s.grade !== null) this.grade = Number(s.grade) || 0
          if (s.gradeLocked !== undefined) this.gradeLocked = !!s.gradeLocked
          this.gradeNextUp = s.gradeNextUp || ''
          if (this.gradeLocked) this.needGrade = false
          this.loadReports()
        } else {
          this.dev = Object.assign({}, this.dev, { online: false })
        }
        if (manual) toast('已刷新')
      } catch (e) {
        if (manual) toast('刷新失败，请检查网络')
      }
      this.loading = false
    },
    async loadReports() {
      this.reports = await getReports(this.code, 10)
    },
    later() {
      setTimeout(() => this.load(false), 3000)
    },
    async doUnlock(m) {
      const n = Number(m)
      if (!n || !isFinite(n) || n < 1 || n > 720) {
        toast('时长需在 1~720 分钟之间')
        return
      }
      try {
        await unlock(this.code, n)
        uni.showToast({ title: `已下发：解锁 ${n} 分钟`, icon: 'none' })
        this.customMin = ''
        this.later()
      } catch (e) {
        toast('发送失败，请检查网络')
      }
    },
    doLock() {
      uni.showModal({
        title: '立即锁定',
        content: '设备会马上回到算算星球并结束使用时间，确定吗？',
        confirmText: '锁定',
        confirmColor: '#e5544b',
        success: async (s) => {
          if (!s.confirm) return
          try {
            await lockNow(this.code)
            toast('已下发：立即锁定')
            this.later()
          } catch (e) {
            toast('发送失败，请检查网络')
          }
        }
      })
    },
    async doPing() {
      try {
        await ping(this.code)
        toast('已发送，几秒后状态会刷新')
        this.later()
      } catch (e) {
        toast('发送失败，请检查网络')
      }
    },
    async doMsg() {
      const text = String(this.msgText || '').trim()
      if (!text) {
        toast('先写点什么吧')
        return
      }
      try {
        await message(this.code, text)
        this.msgText = ''
        toast('消息已发送')
        this.later()
      } catch (e) {
        toast('发送失败，请检查网络')
      }
    },
    async setRule(key, value) {
      const next = Object.assign({}, this.rules, { [key]: value })
      const old = this.rules
      this.rules = next
      try {
        await setRules(this.code, next)
        toast('规则已更新')
        this.later()
      } catch (e) {
        this.rules = old
        toast('发送失败，请检查网络')
      }
    },
    async doGrade(g) {
      const old = this.grade
      const oldLock = this.gradeLocked
      this.grade = g
      this.gradeLocked = true
      this.needGrade = false
      try {
        await setGrade(this.code, g, true)
        toast('已设定：' + GRADE_NAMES[g] + '（孩子端不可改）')
        this.later()
        setTimeout(() => this.load(false), 4000)
      } catch (e) {
        this.grade = old
        this.gradeLocked = oldLock
        toast('发送失败，请检查网络')
      }
    },
    async allowChild() {
      const old = this.gradeLocked
      this.gradeLocked = false
      try {
        await setGrade(this.code, this.grade, false)
        toast('已允许孩子自选年级')
        this.later()
      } catch (e) {
        this.gradeLocked = old
        toast('发送失败，请检查网络')
      }
    },
    async doRename() {
      const name = String(this.nameIn || '').trim()
      if (!name) {
        toast('名称不能为空')
        return
      }
      await renameDevice(this.code, name)
      this.dev = Object.assign({}, this.dev, { name })
      toast('已重命名')
    },
    doUnbind() {
      uni.showModal({
        title: '解除绑定',
        content: '将不再控制这台设备，孩子设备的本地规则不受影响。',
        confirmText: '解除',
        confirmColor: '#e5544b',
        success: (s) => {
          if (!s.confirm) return
          unbind(this.code)
          const rest = listBound()
          uni.showToast({ title: '已解除绑定', icon: 'none' })
          setTimeout(() => {
            if (rest.length) this.back()
            else uni.reLaunch({ url: '/pages/index/index' })
          }, 500)
        }
      })
    },
    goReport() {
      uni.navigateTo({ url: '/pages/report/index?code=' + this.code + '&name=' + encodeURIComponent(this.dev.name || '') })
    }
  }
}
</script>

<style scoped>
.devt {
  font-size: 40rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.icon-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #6b6259;
  margin-left: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(120, 100, 80, 0.08);
  flex: none;
}
.spin {
  animation: sp 1s linear infinite;
}
@keyframes sp {
  to { transform: rotate(360deg); }
}
.code {
  margin-left: 16rpx;
  color: #b6aca2;
  font-size: 22rpx;
  letter-spacing: 2rpx;
}

.grid {
  display: flex;
  flex-wrap: wrap;
}
.g {
  width: 50%;
  padding: 14rpx 0;
  text-align: center;
}
.gnum {
  display: block;
  font-size: 46rpx;
  font-weight: 800;
  color: #ff7a3d;
  line-height: 1.25;
}
.gs {
  font-size: 24rpx;
  color: #c0b6ac;
  font-weight: 700;
}
.glbl {
  font-size: 22rpx;
  color: #9a9088;
}

.pills {
  display: flex;
  flex-wrap: wrap;
}
/* 绑定后引导设年级：卡片描边高亮 + 提示条 */
.card.need {
  border: 2rpx solid #ffb27a;
  box-shadow: 0 0 0 6rpx rgba(255, 154, 92, 0.1);
}
.ask {
  background: #fff4e8;
  color: #a2622c;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.6;
  border-radius: 18rpx;
  padding: 18rpx 22rpx;
  margin-bottom: 18rpx;
}
.lockbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #f6f1eb;
}
.lk {
  font-size: 24rpx;
  font-weight: 700;
  color: #a2622c;
  flex: 1;
  margin-right: 16rpx;
  line-height: 1.5;
}
.lk.muted {
  font-weight: 500;
  color: #a89e94;
}
.lkbtn {
  font-size: 24rpx;
  color: #ff7a3d;
  font-weight: 700;
  flex: none;
}
.pills.inline {
  flex: 1;
  justify-content: flex-end;
}
.pill.sm {
  padding: 10rpx 22rpx;
  font-size: 24rpx;
  margin-bottom: 10rpx;
}

.row2 {
  display: flex;
  align-items: center;
  margin-top: 14rpx;
}
.row2 .ipt {
  margin-right: 16rpx;
}
.flex1 {
  flex: 1;
  margin-right: 16rpx;
}
.flex1:last-child {
  margin-right: 0;
}
.ph {
  color: #b6aca2;
}

.line {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
  border-top: 1rpx solid #f6f1eb;
}
.line:first-of-type {
  border-top: none;
}
.lab {
  width: 150rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #6b6259;
  flex: none;
}

.rep {
  border-top: 1rpx solid #f6f1eb;
  padding: 16rpx 0;
}
.rep:first-of-type {
  border-top: none;
}
.rephead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.repl {
  font-size: 28rpx;
  font-weight: 700;
}
.acc {
  font-size: 26rpx;
  font-weight: 800;
  color: #e5544b;
}
.acc.good {
  color: #2fbf87;
}
.reptime {
  font-size: 22rpx;
  color: #b6aca2;
  margin-top: 6rpx;
}
.unbind {
  margin-top: 20rpx;
}
</style>
