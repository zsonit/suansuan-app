<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="hd">
      <view class="hd-row">
        <view class="hd-title">家长控制台</view>
        <view class="icon-btn" :class="{ spin: loading }" @click="load(true)">⟳</view>
        <view class="icon-btn" @click="goMe">⚙</view>
      </view>
      <view class="hd-sub">算算星球 · 远程管理孩子的学习设备</view>
    </view>

    <!-- 绑定 -->
    <view class="card">
      <view class="card-t">
        <text>绑定孩子设备</text>
        <text class="hint">{{ bound.length }} 台已绑定</text>
      </view>
      <view class="bindrow">
        <input
          class="ipt code"
          v-model="codeIn"
          maxlength="8"
          placeholder="输入 8 位配对码"
          placeholder-class="ph"
          :disabled="binding"
          @confirm="doBind"
        />
        <view class="btn bindbtn" :class="{ dis: binding }" @click="doBind">
          {{ binding ? '绑定中' : '绑定' }}
        </view>
      </view>
      <view class="err" v-if="bindErr">{{ bindErr }}</view>
      <view class="muted tip">
        配对码在孩子设备「设置 → 家长远程控制」里，一次配对永久有效。可绑定多台设备（多个孩子 / 手机平板电视）。
      </view>
    </view>

    <!-- 设备列表 -->
    <view v-for="r in rows" :key="r.code" class="card dev" @click="goDevice(r.code)">
      <view class="devhead">
        <view class="dot" :class="{ on: r.online }"></view>
        <text class="devname">{{ r.name }}</text>
        <text class="ol" :class="{ on: r.online }">{{ r.online ? '在线' : onlineText(r.onlineAt) }}</text>
      </view>

      <view class="stats">
        <view class="stat">
          <text class="num">{{ r.avail }}</text>
          <text class="lbl">还能用(分)</text>
        </view>
        <view class="stat">
          <text class="num">{{ r.dailyDone }}<text class="slash">/{{ r.dailyQ }}</text></text>
          <text class="lbl">今日任务</text>
        </view>
        <view class="stat">
          <text class="num">{{ r.chalDone }}</text>
          <text class="lbl">挑战题数</text>
        </view>
      </view>

      <view class="quick">
        <view
          v-for="m in QUICK"
          :key="m"
          class="pill q"
          @click.stop="doUnlock(r, m)"
        >+{{ m }}分</view>
        <view class="pill q danger" @click.stop="doLock(r)">立即锁定</view>
      </view>

      <view class="more">
        <text>{{ r.gradeText }} · {{ r.rulesOn ? '专注锁定运行中' : '专注锁定已关闭' }}</text>
        <text class="arrow">查看详情与做题报告 ›</text>
      </view>
    </view>

    <view v-if="!rows.length" class="card empty">
      还没有绑定设备{{ '\n' }}输入孩子设备上的 8 位配对码即可开始远程管理
    </view>

    <view class="foot muted">
      孩子设备断网时，本机的专注锁定 / 每日任务 / 挑战赛规则照常运行，云端只做叠加控制。
    </view>
  </view>
</template>

<script>
import {
  listBound, refreshAll, unlock, lockNow, onlineText, GRADE_NAMES, toast
} from '@/common/cloud'

const QUICK = [5, 10, 15, 30]

export default {
  data() {
    return {
      QUICK,
      codeIn: '',
      bindErr: '',
      binding: false,
      loading: false,
      bound: [],
      devices: {},
      timer: null
    }
  },
  computed: {
    rows() {
      return this.bound.map((b) => {
        const d = this.devices[b.code] || null
        const st = (d && d.state) || {}
        const rules = st.rules || {}
        const g = st.grade !== undefined && st.grade !== null ? Number(st.grade) : -1
        const locked = !!st.gradeLocked
        let gradeText = '年级待设置'
        if (g >= 0) gradeText = (GRADE_NAMES[g] || g + ' 年级') + (locked ? ' · 已锁定' : ' · 孩子可自选')
        return {
          code: b.code,
          name: (d && d.name) || b.name || '孩子的设备',
          online: !!(d && d.online),
          onlineAt: d ? d.onlineAt : 0,
          avail: Number(st.avail) || 0,
          dailyDone: Number(st.dailyDone) || 0,
          dailyQ: Number(rules.dailyQ) || 30,
          chalDone: Number(st.chalDone) || 0,
          rulesOn: rules.on !== false,
          gradeText
        }
      })
    }
  },
  onShow() {
    this.bound = listBound()
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
    startTimer() {
      this.stopTimer()
      this.timer = setInterval(() => this.load(false), 10000)
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    async load(manual) {
      this.bound = listBound()
      if (manual) this.loading = true
      try {
        const map = await refreshAll(this.bound.map((d) => d.code))
        this.devices = Object.assign({}, this.devices, map)
        if (manual) toast('已刷新')
      } catch (e) {
        if (manual) toast('刷新失败，请检查网络')
      }
      this.loading = false
    },
    async doBind() {
      if (this.binding) return
      const code = String(this.codeIn || '').trim().toUpperCase()
      this.bindErr = ''
      if (!/^[A-Z0-9]{8}$/.test(code)) {
        this.bindErr = '配对码是 8 位字母数字，请核对孩子设备上的显示'
        return
      }
      this.binding = true
      try {
        this.bound = await bind(code)
        this.codeIn = ''
        toast('绑定成功')
        // 绑定成功直接进入设备页，第一步先选孩子年级
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/device/index?code=' + code + '&setup=1' })
        }, 350)
      } catch (e) {
        this.bindErr = String((e && e.message) || '绑定失败')
      }
      this.binding = false
    },
    async doUnlock(r, m) {
      try {
        await unlock(r.code, m)
        uni.showToast({ title: `已下发：解锁 ${m} 分钟`, icon: 'none' })
        setTimeout(() => this.load(false), 2000)
      } catch (e) {
        toast('发送失败，请检查网络')
      }
    },
    async doLock(r) {
      const res = await new Promise((ok) => {
        uni.showModal({
          title: '立即锁定',
          content: `让「${r.name}」马上回到算算星球并结束使用时间？`,
          confirmText: '锁定',
          confirmColor: '#e5544b',
          success: (s) => ok(!!s.confirm),
          fail: () => ok(false)
        })
      })
      if (!res) return
      try {
        await lockNow(r.code)
        toast('已下发：立即锁定')
        setTimeout(() => this.load(false), 2000)
      } catch (e) {
        toast('发送失败，请检查网络')
      }
    },
    goDevice(code) {
      uni.navigateTo({ url: '/pages/device/index?code=' + code })
    },
    goMe() {
      uni.navigateTo({ url: '/pages/me/index' })
    }
  }
}
</script>

<style scoped>
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
}
.spin {
  animation: sp 1s linear infinite;
}
@keyframes sp {
  to { transform: rotate(360deg); }
}

.bindrow {
  display: flex;
  align-items: center;
}
.code {
  letter-spacing: 6rpx;
  font-weight: 700;
  margin-right: 16rpx;
}
.bindbtn {
  width: 168rpx;
  flex: none;
}
.ph {
  letter-spacing: 0;
  font-weight: 400;
  color: #b6aca2;
}
.tip {
  margin-top: 16rpx;
}

/* 设备卡 */
.dev:active {
  background: #fffdfb;
}
.devhead {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.devname {
  font-size: 34rpx;
  font-weight: 800;
  flex: 1;
}
.ol {
  font-size: 22rpx;
  color: #a89e94;
}
.ol.on {
  color: #2fbf87;
  font-weight: 700;
}

.stats {
  display: flex;
  background: #f9f6f2;
  border-radius: 22rpx;
  padding: 20rpx 0;
}
.stat {
  flex: 1;
  text-align: center;
}
.num {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #ff7a3d;
  line-height: 1.2;
}
.slash {
  font-size: 24rpx;
  color: #c0b6ac;
  font-weight: 700;
}
.lbl {
  font-size: 21rpx;
  color: #9a9088;
}

.quick {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}
.q {
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  margin: 0 12rpx 12rpx 0;
}
.q.danger {
  background: #fff1ef;
  border-color: #ffd8d3;
  color: #e5544b;
}

.more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid #f3ede6;
  padding-top: 18rpx;
  font-size: 23rpx;
  color: #a89e94;
}
.arrow {
  color: #ff7a3d;
  font-weight: 700;
}

.foot {
  margin-top: 36rpx;
  text-align: center;
  padding: 0 20rpx;
}
</style>
