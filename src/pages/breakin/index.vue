<template>
  <view class="brk">
    <view class="brk-head">
      <text class="brk-emoji">⏰</text>
      <view class="brk-head-main">
        <text class="brk-title">观看时间到！</text>
        <text class="brk-sub">答对 {{ NEED }} 道题，赢 {{ NEED }} 分钟继续看</text>
      </view>
      <text class="brk-prog" v-if="stage !== 'pick'">{{ right }}/{{ NEED }}</text>
    </view>

    <!-- 第一步：选一组题（像题了个题一样，弹出所有卡片来选） -->
    <view v-if="stage === 'pick'" class="brk-body">
      <text class="brk-hint">选一张卡片开始挑战</text>
      <view v-for="b in banks" :key="b.key" class="brk-card" @click="pick(b.key)">
        <text class="brk-card-icon">{{ b.icon }}</text>
        <view class="brk-card-main">
          <text class="brk-card-name">{{ b.name }}</text>
          <text class="brk-card-desc">{{ b.desc }}</text>
        </view>
        <text class="brk-card-chev">›</text>
      </view>
      <text v-if="!svcOn" class="brk-skip" @click="skip">暂不挑战，回练习（未开启锁定服务）</text>
    </view>

    <!-- 第二步：答题 -->
    <view v-if="stage === 'quiz'" class="brk-body">
      <view class="brk-bar">
        <view class="brk-bar-fill" :style="{ width: (right / NEED) * 100 + '%' }"></view>
      </view>
      <view class="brk-q">{{ q.text }}</view>
      <view class="brk-opts">
        <view
          v-for="(op, i) in q.options"
          :key="i"
          class="brk-opt"
          :class="{ ok: feedback && op === q.answer, bad: feedback && picked === op && op !== q.answer }"
          @click="answer(op)"
        >
          {{ op }}
        </view>
      </view>
      <view v-if="feedback" class="brk-fb" :class="feedback">
        <text class="brk-fb-t">{{ feedback === 'right' ? pickName + ' 答对啦！🎉' : '正确答案：' + q.answer }}</text>
        <text v-if="feedback === 'wrong' && q.tip" class="brk-fb-tip">{{ q.tip }}</text>
        <view class="brk-fb-btn" @click="next">{{ right >= NEED ? '领取奖励 🎁' : '继续' }}</view>
      </view>
    </view>

    <!-- 第三步：领奖回桌面 -->
    <view v-if="stage === 'done'" class="brk-body brk-done">
      <text class="brk-done-emoji">🎉</text>
      <text class="brk-done-t">太棒了！奖励 {{ got }} 分钟</text>
      <text class="brk-done-sub">马上回去继续看…</text>
    </view>
  </view>
</template>

<script>
import { OPEN_BANKS } from '@/common/openbank'
import { getWatchRules, addWatchEarned, claimWatch } from '@/common/store'
import { isServiceOn, startUnlock } from '@/common/kiosk'
import { sfx, cheerRight, cheerWrong } from '@/common/sound'

const NEED = 10

export default {
  data() {
    return {
      NEED,
      stage: 'pick',
      banks: Object.values(OPEN_BANKS),
      pickName: '',
      queue: [],
      qi: 0,
      right: 0,
      picked: '',
      feedback: '',
      svcOn: false,
      got: 0
    }
  },
  computed: {
    q() {
      return this.queue[this.qi] || { text: '', options: [] }
    }
  },
  async onLoad() {
    this.svcOn = await isServiceOn()
  },
  methods: {
    pick(key) {
      const bank = OPEN_BANKS[key]
      this.pickName = bank.name
      // 组一个足够长的循环题队：题库打乱后反复抽，保证答对 10 题前够用
      const qs = []
      for (let p = 0; p < 4; p++) {
        const pool = [...bank.items]
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[pool[i], pool[j]] = [pool[j], pool[i]]
        }
        for (const it of pool) {
          qs.push({ text: it.text, options: it.options, answer: it.answer, tip: it.tip })
        }
      }
      this.queue = qs
      this.qi = 0
      this.right = 0
      this.picked = ''
      this.feedback = ''
      this.stage = 'quiz'
    },
    answer(op) {
      if (this.feedback) return
      this.picked = op
      if (op === this.q.answer) {
        this.right++
        this.feedback = 'right'
        cheerRight()
        sfx('right')
      } else {
        this.feedback = 'wrong'
        cheerWrong()
        sfx('wrong')
      }
    },
    next() {
      if (this.right >= NEED) {
        this.finish()
        return
      }
      this.picked = ''
      this.feedback = ''
      this.qi++
    },
    async finish() {
      this.stage = 'done'
      const rules = getWatchRules()
      if (rules.on) {
        // 10 题 10 分钟 = 每题 1 分钟，与「每题奖励」规则一致
        addWatchEarned(NEED * (rules.perQ || 1))
        this.got = claimWatch() // 记账 + 设定解锁截止
      }
      if (this.got > 0 && this.svcOn) {
        // 暂停拉回并回桌面，时间到无障碍服务会再次把孩子带回来挑战
        setTimeout(async () => {
          await startUnlock(this.got)
        }, 1800)
      } else {
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1800)
      }
    },
    skip() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style>
.brk {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #ff9a5c 0%, #ff7a3d 45%, #ff6b2d 100%);
  display: flex;
  flex-direction: column;
  padding: max(24px, env(safe-area-inset-top)) 28px 24px;
  overflow: hidden;
}
.brk-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 0 18px;
}
.brk-emoji {
  font-size: 44px;
}
.brk-head-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.brk-title {
  font-size: 30px;
  font-weight: 800;
  color: #ffffff;
}
.brk-sub {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.92);
}
.brk-prog {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 20px;
  padding: 6px 16px;
}
.brk-body {
  flex: 1;
  background: #fff9f0;
  border-radius: 28px;
  padding: 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}
.brk-hint {
  font-size: 19px;
  font-weight: 700;
  color: #8a7a6d;
}
.brk-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border: 3px solid #ffe3cd;
  border-radius: 22px;
  padding: 20px 18px;
}
.brk-card:active {
  background: #fff3e8;
}
.brk-card-icon {
  font-size: 40px;
}
.brk-card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.brk-card-name {
  font-size: 23px;
  font-weight: 800;
  color: #332c26;
}
.brk-card-desc {
  font-size: 15px;
  color: #a08f80;
}
.brk-card-chev {
  font-size: 30px;
  color: #ffc9a6;
  font-weight: 700;
}
.brk-skip {
  margin-top: auto;
  text-align: center;
  font-size: 15px;
  color: #b7a99b;
  padding: 12px;
}
.brk-bar {
  height: 14px;
  background: #ffe9d8;
  border-radius: 8px;
  overflow: hidden;
}
.brk-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb27a, #ff7a3d);
  border-radius: 8px;
  transition: width 0.3s;
}
.brk-q {
  font-size: 26px;
  font-weight: 800;
  color: #332c26;
  line-height: 1.5;
  padding: 8px 0 4px;
}
.brk-opts {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.brk-opt {
  background: #ffffff;
  border: 3px solid #ffe3cd;
  border-radius: 18px;
  padding: 20px 18px;
  font-size: 22px;
  font-weight: 700;
  color: #332c26;
  text-align: center;
}
.brk-opt:active {
  background: #fff3e8;
}
.brk-opt.ok {
  background: #e8f8ec;
  border-color: #4cc47c;
  color: #1d7a45;
}
.brk-opt.bad {
  background: #fdeaea;
  border-color: #e05c5c;
  color: #b23a3a;
}
.brk-fb {
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.brk-fb.right {
  background: #e8f8ec;
}
.brk-fb.wrong {
  background: #fdeaea;
}
.brk-fb-t {
  font-size: 20px;
  font-weight: 800;
}
.brk-fb.right .brk-fb-t {
  color: #1d7a45;
}
.brk-fb.wrong .brk-fb-t {
  color: #b23a3a;
}
.brk-fb-tip {
  font-size: 16px;
  color: #8a7a6d;
  line-height: 1.5;
}
.brk-fb-btn {
  margin-top: 4px;
  background: #ff7a3d;
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
}
.brk-done {
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.brk-done-emoji {
  font-size: 88px;
}
.brk-done-t {
  font-size: 30px;
  font-weight: 800;
  color: #332c26;
}
.brk-done-sub {
  font-size: 18px;
  color: #a08f80;
}
</style>
