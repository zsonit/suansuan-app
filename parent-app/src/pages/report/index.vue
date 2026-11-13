<template>
  <view class="page">
    <view class="hd">
      <view class="hd-row">
        <view class="back" @click="back">‹</view>
        <view class="hd-title">做题报告</view>
        <view class="icon-btn" :class="{ spin: loading }" @click="load(true)">⟳</view>
      </view>
      <view class="hd-sub">{{ devName || '孩子设备' }} · 最近 {{ reports.length }} 组练习</view>
    </view>

    <!-- 汇总 -->
    <view class="card sum" v-if="reports.length">
      <view class="s">
        <text class="snum">{{ reports.length }}</text>
        <text class="slbl">练习组数</text>
      </view>
      <view class="s">
        <text class="snum">{{ totalQ }}</text>
        <text class="slbl">总题数</text>
      </view>
      <view class="s">
        <text class="snum">{{ avgAcc }}<text class="pct">%</text></text>
        <text class="slbl">平均正确率</text>
      </view>
      <view class="s">
        <text class="snum">{{ wrongCount }}</text>
        <text class="slbl">错题(去重)</text>
      </view>
    </view>

    <!-- 报告列表 -->
    <view v-for="(r, i) in reports" :key="'r' + i" class="card rep">
      <view class="rephead" @click="toggle(i)">
        <view class="rh-l">
          <text class="tag" :class="tagClass(r)">{{ sessionLabel(r) }}</text>
          <text class="rtime">{{ fmtTime(r.created_at) }}</text>
        </view>
        <view class="rh-r">
          <text class="acc" :class="{ good: accuracy(r) >= 80 }">{{ accuracy(r) }}%</text>
          <text class="cnt">{{ d(r).right || 0 }}/{{ d(r).total || 0 }}</text>
        </view>
      </view>

      <view class="bar">
        <view class="barin" :class="{ good: accuracy(r) >= 80 }" :style="{ width: accuracy(r) + '%' }"></view>
      </view>

      <view class="meta">
        <text v-if="d(r).grade !== undefined && d(r).grade !== null">{{ GRADE_NAMES[d(r).grade] || '—' }}</text>
        <text v-if="d(r).durationMs">用时 {{ Math.round(d(r).durationMs / 1000) }} 秒</text>
        <text :class="{ bad: (d(r).wrong || []).length }">
          {{ (d(r).wrong || []).length ? '错 ' + (d(r).wrong || []).length + ' 题' : '全部答对 🎉' }}
        </text>
      </view>

      <view v-if="open[i]" class="wrongs">
        <view v-if="!(d(r).wrong || []).length" class="muted">这一组没有错题，很稳。</view>
        <view v-for="(w, j) in (d(r).wrong || [])" :key="'w' + i + '_' + j" class="wrong">
          <text class="wno">{{ j + 1 }}</text>
          <view class="wbody">
            <text class="wt">{{ w.text }}</text>
            <text class="wa">答了 <text class="your">{{ w.your || '空' }}</text> · 正确 <text class="right">{{ w.answer }}</text></text>
          </view>
        </view>
      </view>

      <view v-if="(d(r).wrong || []).length" class="toggle" @click="toggle(i)">
        {{ open[i] ? '收起错题' : '展开错题明细' }}
      </view>
    </view>

    <view v-if="!reports.length && !loading" class="card empty">
      还没有做题报告{{ '\n' }}孩子做完一组题后会自动同步到这里，稍等几秒再刷新
    </view>

    <view class="muted foot">
      报告由孩子设备在做完题后自动上传；断网时会跳过，不影响孩子本机的练习与计时。
    </view>
  </view>
</template>

<script>
import { getReports, fmtTime, sessionLabel, accuracy, GRADE_NAMES, toast } from '@/common/cloud'

export default {
  data() {
    return {
      GRADE_NAMES,
      code: '',
      devName: '',
      reports: [],
      open: {},
      loading: false
    }
  },
  computed: {
    totalQ() {
      return this.reports.reduce((s, r) => s + (Number(this.d(r).total) || 0), 0)
    },
    avgAcc() {
      if (!this.reports.length) return 0
      const sum = this.reports.reduce((s, r) => s + this.accuracy(r), 0)
      return Math.round(sum / this.reports.length)
    },
    wrongCount() {
      const set = {}
      this.reports.forEach((r) => {
        (this.d(r).wrong || []).forEach((w) => {
          set[w.text] = 1
        })
      })
      return Object.keys(set).length
    }
  },
  onLoad(options) {
    this.code = String((options && options.code) || '').toUpperCase()
    try {
      this.devName = decodeURIComponent((options && options.name) || '')
    } catch (e) {
      this.devName = ''
    }
  },
  onShow() {
    this.load(false)
  },
  methods: {
    fmtTime,
    sessionLabel,
    accuracy,
    d(r) {
      return (r && r.data) || {}
    },
    tagClass(r) {
      const s = this.d(r).source
      if (s === 'daily') return 'daily'
      if (s === 'challenge') return 'chal'
      return 'free'
    },
    back() {
      uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    },
    toggle(i) {
      const next = Object.assign({}, this.open)
      next[i] = !next[i]
      this.open = next
    },
    async load(manual) {
      if (!this.code) return
      this.loading = true
      this.reports = await getReports(this.code, 30)
      this.loading = false
      if (manual) toast('已刷新')
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
  box-shadow: 0 2rpx 12rpx rgba(120, 100, 80, 0.08);
  flex: none;
}
.spin {
  animation: sp 1s linear infinite;
}
@keyframes sp {
  to { transform: rotate(360deg); }
}

.sum {
  display: flex;
  padding: 24rpx 0;
}
.s {
  flex: 1;
  text-align: center;
}
.snum {
  display: block;
  font-size: 42rpx;
  font-weight: 800;
  color: #ff7a3d;
  line-height: 1.2;
}
.pct {
  font-size: 24rpx;
}
.slbl {
  font-size: 21rpx;
  color: #9a9088;
}

.rephead {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rh-l {
  display: flex;
  align-items: center;
}
.rh-r {
  display: flex;
  align-items: baseline;
}
.tag {
  font-size: 22rpx;
  font-weight: 700;
  padding: 6rpx 16rpx;
  border-radius: 10rpx;
  margin-right: 12rpx;
  background: #f4efe9;
  color: #8b8279;
}
.tag.daily {
  background: #fff3e9;
  color: #ff7a3d;
}
.tag.chal {
  background: #eaf7f1;
  color: #2ab07c;
}
.rtime {
  font-size: 23rpx;
  color: #a89e94;
}
.acc {
  font-size: 34rpx;
  font-weight: 800;
  color: #e5544b;
}
.acc.good {
  color: #2fbf87;
}
.cnt {
  font-size: 23rpx;
  color: #a89e94;
  margin-left: 10rpx;
}

.bar {
  height: 10rpx;
  background: #f4efe9;
  border-radius: 100rpx;
  margin: 18rpx 0 14rpx;
  overflow: hidden;
}
.barin {
  height: 100%;
  background: linear-gradient(90deg, #ffb27a, #ff7a3d);
  border-radius: 100rpx;
  transition: width 0.4s;
}
.barin.good {
  background: linear-gradient(90deg, #7fe0b6, #2fbf87);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  font-size: 22rpx;
  color: #a89e94;
}
.meta text {
  margin-right: 20rpx;
}
.meta .bad {
  color: #e5544b;
  font-weight: 700;
}

.wrongs {
  margin-top: 16rpx;
  background: #fbf8f5;
  border-radius: 20rpx;
  padding: 18rpx 20rpx;
}
.wrong {
  display: flex;
  padding: 10rpx 0;
  border-top: 1rpx solid #f3ece4;
}
.wrong:first-child {
  border-top: none;
}
.wno {
  width: 36rpx;
  font-size: 22rpx;
  color: #c0b6ac;
  flex: none;
  line-height: 1.7;
}
.wbody {
  flex: 1;
}
.wt {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
  color: #3a332c;
  line-height: 1.6;
}
.wa {
  display: block;
  font-size: 23rpx;
  color: #a89e94;
  margin-top: 2rpx;
}
.your {
  color: #e5544b;
  font-weight: 700;
}
.right {
  color: #2ab07c;
  font-weight: 700;
}

.toggle {
  margin-top: 14rpx;
  text-align: center;
  font-size: 24rpx;
  color: #ff7a3d;
  font-weight: 700;
  padding: 6rpx 0;
}

.foot {
  text-align: center;
  margin-top: 36rpx;
  padding: 0 20rpx;
}
</style>
