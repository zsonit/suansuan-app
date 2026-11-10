<template>
  <view class="page" :class="[{ eye: settings.eyeCare }, fbClass]">
    <view class="nav">
      <view class="close" @click="quit">✕</view>
      <view class="nav-mid">
        <text class="progress-text">{{ idx + 1 }} / {{ total }}</text>
        <text class="timer">{{ timeText }}</text>
      </view>
      <view class="close placeholder"></view>
    </view>

    <view class="progress">
      <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
    </view>

    <view class="stage">
      <view class="card" :class="feedback">
        <text
          class="expr"
          :class="{ small: String(current.text).length > 9 }"
          v-if="qType === 'input' || qType === 'frac'"
        >{{ current.text }} =</text>
        <text
          class="expr"
          :class="{ small: String(current.text).length > 9 }"
          v-else
        >{{ current.text }}</text>
        <view
          class="answer"
          :class="feedback"
          v-if="qType === 'input' || qType === 'frac'"
        >
          <text v-if="input" class="answer-num">{{ input }}</text>
          <text v-else class="answer-hold">?</text>
          <view class="caret" v-if="!feedback"></view>
        </view>

        <!-- 比大小：选符号 -->
        <view class="choices" v-if="qType === 'compare' && !feedback">
          <view
            v-for="s in ['<', '=', '>']"
            :key="s"
            class="choice sym"
            @click="submitChoice(s)"
          >
            {{ s }}
          </view>
        </view>

        <!-- 对错判断 -->
        <view class="choices" v-if="qType === 'judge' && !feedback">
          <view class="choice ok" @click="submitChoice('√')">✓ 对</view>
          <view class="choice no" @click="submitChoice('×')">✗ 错</view>
        </view>

        <!-- 语文/英语：四选一 -->
        <view class="choices grid4" v-if="qType === 'choice' && !feedback">
          <view
            v-for="(o, i) in current.options"
            :key="i"
            class="choice pick"
            @click="submitChoice(o)"
          >
            <text class="pick-txt" :class="{ small: String(o).length > 3 }">{{ o }}</text>
          </view>
        </view>

        <view class="mark" v-if="feedback === 'right'">
          <text class="mark-icon">✓</text>
          <text class="mark-text">答对啦</text>
        </view>
        <view class="mark" v-if="feedback === 'wrong'">
          <text class="mark-icon">✕</text>
          <text class="mark-text">正确答案是 {{ current.answer }}</text>
        </view>

        <view class="next-btn" v-if="feedback && !settings.autoNext" @click="next">
          继续 ›
        </view>
      </view>
    </view>

    <view class="pad" v-if="qType === 'input' || qType === 'frac'">
      <view
        v-for="k in keys"
        :key="k.val"
        class="key"
        :class="k.type"
        @click="press(k.val)"
      >
        {{ k.label }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { generate, generateForGrade, fromWrong } from '@/common/questions'
import { lemiaoGenerate } from '@/common/lemiao'
import { getSettings, addWrong, addRecord, saveResult, getWrong } from '@/common/store'
import { sfx, speak, cheerRight, CHEERS_STREAK } from '@/common/sound'

const baseKeys = [
  { val: '1', label: '1', type: 'num' },
  { val: '2', label: '2', type: 'num' },
  { val: '3', label: '3', type: 'num' },
  { val: '4', label: '4', type: 'num' },
  { val: '5', label: '5', type: 'num' },
  { val: '6', label: '6', type: 'num' },
  { val: '7', label: '7', type: 'num' },
  { val: '8', label: '8', type: 'num' },
  { val: '9', label: '9', type: 'num' },
  { val: 'del', label: '⌫', type: 'fn' },
  { val: '0', label: '0', type: 'num' },
  { val: 'ok', label: '确定', type: 'ok' }
]
// 小数题加 . 键、分数题加 / 键
const keys = computed(() => {
  if (qType.value === 'frac') {
    return [...baseKeys.slice(0, 9), { val: '/', label: '/', type: 'fn' }, ...baseKeys.slice(9)]
  }
  if (cfg.value.mode === 'dec' || current.value.dot) {
    return [...baseKeys.slice(0, 9), { val: '.', label: '.', type: 'fn' }, ...baseKeys.slice(9)]
  }
  return baseKeys
})

const settings = ref(getSettings())
const list = ref([])
const idx = ref(0)
const input = ref('')
const rightCount = ref(0)
const wrongList = ref([])
const feedback = ref('') // '' | 'right' | 'wrong'
const elapsed = ref(0)
const cfg = ref({ mode: 'add', difficulty: 1, count: 10, source: '', key: '' })

let tick = null
let jump = null

const total = computed(() => list.value.length)
const current = computed(() => list.value[idx.value] || { text: '', answer: 0 })
const qType = computed(() => current.value.type || 'input')
const progressPct = computed(() => (total.value ? (idx.value / total.value) * 100 : 0))
const fbClass = computed(() => (feedback.value ? 'fb-' + feedback.value : ''))
const timeText = computed(() => {
  const s = elapsed.value
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})

onLoad((q) => {
  cfg.value = {
    mode: q.mode || 'add',
    difficulty: Number(q.difficulty || 1),
    count: Number(q.count || 10),
    source: q.source || '',
    key: q.key || '',
    grade: Number(q.grade || 0)
  }

  if (cfg.value.source === 'wrong') {
    list.value = fromWrong(getWrong())
  } else if (cfg.value.source === 'lemiao' && cfg.value.key) {
    list.value = lemiaoGenerate(cfg.value.key, cfg.value.count)
  } else if (cfg.value.source === 'grade' && cfg.value.grade) {
    list.value = generateForGrade(cfg.value.grade, cfg.value.count)
  } else {
    list.value = generate(cfg.value.mode, cfg.value.difficulty, cfg.value.count)
  }

  if (!list.value.length) {
    uni.showToast({ title: '没有可练习的题目', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }

  tick = setInterval(() => {
    elapsed.value++
  }, 1000)
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
  if (jump) clearTimeout(jump)
})

function buzz(long) {
  if (!settings.value.haptic) return
  try {
    long ? uni.vibrateLong() : uni.vibrateShort()
  } catch (e) {}
}

function press(val) {
  if (feedback.value) return
  if (val === 'del') {
    input.value = input.value.slice(0, -1)
    return
  }
  if (val === 'ok') {
    submit()
    return
  }
  if (input.value.length >= 7) return
  // . 和 / 只允许出现一次
  if ((val === '.' || val === '/') && input.value.includes(val)) return
  if (input.value === '0' && val !== '.' && val !== '/') input.value = val
  else input.value += val
}

function submit() {
  if (feedback.value) return
  if (input.value === '') {
    uni.showToast({ title: '先输入答案哦', icon: 'none' })
    return
  }
  settle(input.value)
}

// compare / judge 直接点选作答
function submitChoice(val) {
  if (feedback.value) return
  settle(val)
}

function parseFrac(s) {
  const t = String(s || '').trim()
  const m = t.match(/^(\d+)\/(\d+)$/)
  if (m) return [+m[1], +m[2]]
  if (/^\d+$/.test(t)) return [+t, 1]
  return null
}

function isCorrect(q, raw) {
  // 分数答案（形如 3/5）按交叉相乘比较
  if (q.type === 'frac' || (q.type !== 'choice' && typeof q.answer === 'string' && q.answer.includes('/'))) {
    const a = parseFrac(raw)
    const b = parseFrac(q.answer)
    return !!a && !!b && a[0] * b[1] === b[0] * a[1]
  }
  // 字符串答案（比大小符号、判断、语文/英语选择题）
  if (typeof q.answer === 'string') return String(raw) === q.answer
  return Number(raw) === q.answer
}

function settle(my) {
  const q = current.value
  const ok = isCorrect(q, my)
  if (ok) {
    rightCount.value++
    feedback.value = 'right'
    buzz(false)
    sfx('right')
    // 连对 5 题喊一次鼓励
    if (rightCount.value > 0 && rightCount.value % 5 === 0 && wrongList.value.length === 0) {
      sfx('combo', rightCount.value / 5)
      speak(CHEERS_STREAK[Math.floor(Math.random() * CHEERS_STREAK.length)])
    } else if (Math.random() < 0.25) {
      cheerRight()
    }
  } else {
    wrongList.value.push({ text: q.text, answer: q.answer, your: my, type: q.type, options: q.options })
    addWrong({ text: q.text, answer: q.answer, mode: q.mode || cfg.value.mode, options: q.options, type: q.type })
    feedback.value = 'wrong'
    buzz(true)
    sfx('wrong')
  }

  // 自动跳题：开启时按答题速度给不同停顿；关闭时等孩子自己点「继续」
  if (settings.value.autoNext) {
    jump = setTimeout(next, ok ? 340 : 1200)
  }
}

function next() {
  jump = null
  input.value = ''
  feedback.value = ''
  if (idx.value + 1 >= list.value.length) finish()
  else idx.value++
}

function finish() {
  if (tick) clearInterval(tick)
  tick = null

  const rec = {
    mode: cfg.value.source === 'wrong' ? 'wrong' : cfg.value.source === 'grade' ? `grade${cfg.value.grade}` : cfg.value.source === 'lemiao' ? `L_${cfg.value.key}` : cfg.value.mode,
    total: total.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value,
    difficulty: cfg.value.difficulty,
    count: cfg.value.count,
    source: cfg.value.source,
    grade: cfg.value.grade
  }

  addRecord(rec)
  saveResult(rec)
  uni.redirectTo({ url: '/pages/result/index' })
}

function quit() {
  if (idx.value === 0 && input.value === '') {
    uni.navigateBack()
    return
  }
  uni.showModal({
    title: '退出练习？',
    content: '这一组的记录不会保存',
    confirmText: '退出',
    cancelText: '继续练',
    success: (r) => {
      if (r.confirm) uni.navigateBack()
    }
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-top: calc(var(--status-bar-height) + 16rpx);
  background: #fff9f0;
  display: flex;
  flex-direction: column;
}
.page.eye {
  background: #ffeecb;
}
.page.fb-right {
  background: #f1fbf5;
}
.page.fb-wrong {
  background: #fff2f2;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 36rpx;
}
.close {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  font-size: 32rpx;
  color: #8e8176;
  background: #fff;
  border-radius: 50%;
}
.close.placeholder {
  background: transparent;
}
.nav-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.progress-text {
  font-size: 32rpx;
  font-weight: 800;
  color: #332c26;
}
.timer {
  font-size: 22rpx;
  color: #a79c92;
  margin-top: 2rpx;
}

.progress {
  margin: 18rpx 36rpx 0;
  height: 12rpx;
  background: #f2e7db;
  border-radius: 100rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb27a, #ff7a3d);
  border-radius: 100rpx;
  transition: width 0.3s ease;
}

.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 36rpx;
}

.card {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border-radius: 44rpx;
  padding: 56rpx 36rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 4rpx solid #fff;
  box-shadow: 0 20rpx 46rpx rgba(180, 150, 120, 0.14);
  transition: border-color 0.2s;
}
.card.right {
  border-color: #2fbf87;
}
.card.wrong {
  border-color: #ff6b6b;
}
.expr {
  font-size: 76rpx;
  font-weight: 800;
  color: #332c26;
  letter-spacing: 4rpx;
}
.expr.small {
  font-size: 46rpx;
  letter-spacing: 2rpx;
  line-height: 1.5;
}
.answer {
  margin-top: 34rpx;
  min-width: 240rpx;
  height: 120rpx;
  border-radius: 28rpx;
  background: #fff6ee;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx dashed #ffd0ac;
  position: relative;
}
.answer.right {
  background: #e8faf1;
  border-color: #2fbf87;
}
.answer.wrong {
  background: #ffeaea;
  border-color: #ff6b6b;
}
.answer-num {
  font-size: 64rpx;
  font-weight: 800;
  color: #332c26;
}
.answer-hold {
  font-size: 56rpx;
  font-weight: 700;
  color: #d9c8b8;
}
.caret {
  position: absolute;
  right: 40rpx;
  width: 4rpx;
  height: 56rpx;
  background: #ff7a3d;
}

.mark {
  margin-top: 30rpx;
  display: flex;
  align-items: center;
}
.mark-icon {
  font-size: 36rpx;
  font-weight: 800;
  color: #2fbf87;
  margin-right: 12rpx;
}
.mark-text {
  font-size: 28rpx;
  color: #6d6157;
  font-weight: 600;
}
.card.wrong .mark-icon {
  color: #ff6b6b;
}

.next-btn {
  margin-top: 28rpx;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 60rpx;
  border-radius: 100rpx;
  background: #332c26;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
}

.choices {
  margin-top: 40rpx;
  display: flex;
  justify-content: center;
}
.choice {
  min-width: 160rpx;
  height: 128rpx;
  margin: 0 16rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  font-weight: 800;
  color: #332c26;
  background: #fff6ee;
  border: 3rpx solid #ffd0ac;
  border-radius: 28rpx;
}
.choice:active {
  transform: scale(0.95);
  background: #ffe7d0;
}
.choice.sym {
  font-size: 64rpx;
}
.choice.ok {
  color: #1d9d6f;
  border-color: #7fd8b3;
  background: #edfaf3;
}
.choice.no {
  color: #e04f4f;
  border-color: #ffb3b3;
  background: #fff1f1;
}
.choices.grid4 {
  flex-wrap: wrap;
  justify-content: center;
}
.choice.pick {
  width: 44%;
  margin: 0 3% 22rpx;
  box-sizing: border-box;
}
.pick-txt {
  font-size: 46rpx;
  font-weight: 800;
  color: #332c26;
}
.pick-txt.small {
  font-size: 32rpx;
}

.pad {
  display: flex;
  flex-wrap: wrap;
  padding: 10rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
}
.key {
  width: 31.33%;
  margin: 0 1% 16rpx;
  height: 118rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 700;
  color: #332c26;
  background: #fff;
  border-radius: 28rpx;
  box-shadow: 0 8rpx 20rpx rgba(180, 150, 120, 0.12);
}
.key:active {
  transform: scale(0.96);
  background: #fff2e6;
}
.key.fn {
  background: #f6ece1;
  font-size: 36rpx;
  color: #8e8176;
}
.key.ok {
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
  font-size: 32rpx;
  font-weight: 800;
}
</style>
