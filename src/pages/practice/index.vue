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

    <view class="stage" :class="{ lift: qType !== 'input' && qType !== 'frac' }">
      <view class="card" :class="feedback">
        <!-- 图形化说题：十格框 / 骰子 / 物件图 -->
        <view class="qvisual" v-if="current.visual">
          <view class="tf" v-if="current.visual.kind === 'tenframe'">
            <view class="tf-row">
              <view v-for="i in 5" :key="'a' + i" class="tf-cell">
                <text v-if="i <= current.visual.filled" class="tf-icon">{{ current.visual.icon }}</text>
              </view>
            </view>
            <view class="tf-row">
              <view v-for="i in 5" :key="'b' + i" class="tf-cell">
                <text v-if="i + 5 <= current.visual.filled" class="tf-icon">{{ current.visual.icon }}</text>
              </view>
            </view>
          </view>
          <view class="dices" v-if="current.visual.kind === 'dice'">
            <view class="dice" v-for="(d, di) in [current.visual.a, current.visual.b]" :key="di">
              <view
                v-for="i in 9"
                :key="i"
                class="pip-slot"
              >
                <view class="pip" v-if="PIPS[d].includes(i - 1)"></view>
              </view>
            </view>
          </view>
          <view class="bond" v-if="current.visual.kind === 'bond'">
            <text class="bond-top">{{ current.visual.total }}</text>
            <view class="bond-fork">
              <view class="bond-line l"></view>
              <view class="bond-line r"></view>
            </view>
            <view class="bond-nums">
              <text class="bond-num">{{ current.visual.part }}</text>
              <text class="bond-num q">?</text>
            </view>
          </view>
          <!-- 凑十法图形化：大数加小数，把小数拆成「凑十的数」和「剩下的数」 -->
          <view class="bond" v-if="current.visual.kind === 'maketen'">
            <view class="mt-row">
              <text class="mt-num">{{ current.visual.a }}</text>
              <text class="mt-plus">+</text>
              <text class="mt-num mt-b">{{ current.visual.b }}</text>
            </view>
            <view class="bond-fork">
              <view class="bond-line l"></view>
              <view class="bond-line r"></view>
            </view>
            <view class="bond-nums">
              <text class="bond-num">{{ current.visual.need }}</text>
              <text class="bond-num q">{{ current.visual.b - current.visual.need }}</text>
            </view>
            <text class="mt-step">先凑十：{{ current.visual.a }} + {{ current.visual.need }} = 10</text>
          </view>
          <view class="dots" v-if="current.visual.kind === 'dots' && !current.visual.group">
            <text class="dot" v-for="i in current.visual.n" :key="i">{{ current.visual.icon }}</text>
          </view>
          <view class="dots-group" v-if="current.visual.kind === 'dots' && current.visual.group">
            <view class="dotbox">
              <text class="dot" v-for="i in current.visual.group" :key="'g' + i">{{ current.visual.icon }}</text>
            </view>
            <view class="dotbox">
              <text class="dot" v-for="i in current.visual.n - current.visual.group" :key="'h' + i">{{ current.visual.icon }}</text>
            </view>
          </view>
        </view>

        <text
          class="expr"
          :class="{ small: String(current.text).length > 9 }"
          v-if="qType === 'input' || qType === 'frac'"
        >{{ exprShow }}</text>
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

        <!-- 配对玩法：先点算式，再点它的答案 -->
        <view class="match" v-if="qType === 'match' && !feedback">
          <view class="match-cols">
            <view class="match-col">
              <view
                v-for="(p, i) in current.pairs"
                :key="'l' + i"
                class="mcell"
                :class="{ sel: selLeft === i, done: matched.has(i), shake: shakeL === i }"
                @click="tapLeft(i)"
              >
                {{ p.l }}
              </view>
            </view>
            <view class="match-col">
              <view
                v-for="(r, i) in current.rights"
                :key="'r' + i"
                class="mcell"
                :class="{ done: matchedR.has(r), shake: shakeR === i }"
                @click="tapRight(r, i)"
              >
                {{ r }}
              </view>
            </view>
          </view>
          <text class="match-hint">{{ selLeft === null ? '先点一个算式' : '再点它的答案' }}</text>
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
          <text class="mark-sub">{{ current.tip || '没关系，下次努力！' }}</text>
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
import { stagePointGenerate } from '@/common/stages'
import { openGenerate } from '@/common/openbank'
import { getSettings, addWrong, addRecord, saveResult, getWrong, getWatchRules, addWatchEarned } from '@/common/store'
import { sfx, speak, cheerRight, cheerWrong, CHEERS_STREAK } from '@/common/sound'

// 骰子点阵：3x3 槽位（0-8）
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 3, 6, 2, 5, 8]
}

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

// 配对题状态
const selLeft = ref(null)
const matched = ref(new Set())
const matchedR = ref(new Set())
const shakeL = ref(-1)
const shakeR = ref(-1)

let tick = null
let jump = null

const total = computed(() => list.value.length)
const current = computed(() => list.value[idx.value] || { text: '', answer: 0 })
const qType = computed(() => current.value.type || 'input')
// 题干已带 = / ○ 的不再追加等号（修复「2 + ? = 9 =」双等号）
const exprShow = computed(() => {
  const t = String(current.value.text || '')
  return /[=○]/.test(t) ? t : t + ' ='
})
const progressPct = computed(() => {
  if (!total.value) return 0
  const done = idx.value + (feedback.value ? 1 : 0)
  return (done / total.value) * 100
})
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
    fun: q.fun || '',
    grade: Number(q.grade || 0)
  }

  if (cfg.value.source === 'wrong') {
    list.value = fromWrong(getWrong())
  } else if (cfg.value.source === 'point' && cfg.value.key) {
    list.value = stagePointGenerate(cfg.value.key, cfg.value.count, !!cfg.value.fun)
  } else if (cfg.value.source === 'lemiao' && cfg.value.key) {
    list.value = lemiaoGenerate(cfg.value.key, cfg.value.count)
  } else if (cfg.value.source === 'open' && cfg.value.key) {
    list.value = openGenerate(cfg.value.key, cfg.value.count)
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

// —— 配对玩法 ——
function tapLeft(i) {
  if (feedback.value || matched.value.has(i)) return
  selLeft.value = i
  sfx('soft')
}

function tapRight(r, ri_) {
  if (feedback.value || selLeft.value === null || matchedR.value.has(r)) return
  const q = current.value
  const pair = q.pairs[selLeft.value]
  if (pair.r === r) {
    // 配对成功
    matched.value = new Set([...matched.value, selLeft.value])
    matchedR.value = new Set([...matchedR.value, r])
    selLeft.value = null
    sfx('pop')
    buzz(false)
    if (matched.value.size === q.pairs.length) {
      settle('__match__')
    }
  } else {
    // 配错了：抖动提示，本组题记一次错
    shakeR.value = ri_
    sfx('wrong')
    buzz(true)
    if (!wrongList.value.some((w) => w.type === 'match' && w.mode === (q.mode || ''))) {
      wrongList.value.push({ text: `${pair.l} ↔ ${r}（配对）`, answer: pair.r, your: r, type: 'match' })
    }
    setTimeout(() => {
      shakeR.value = -1
    }, 400)
  }
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

// 错一题自动追加同类新题（巩固练习），返回 n 道；生成不出新题时回退当前题
function makeSimilar(n) {
  const src = cfg.value
  let more = []
  if (src.source === 'point' && src.key) {
    more = stagePointGenerate(src.key, n + 3, !!src.fun)
  } else if (src.source === 'lemiao' && src.key) {
    more = lemiaoGenerate(src.key, n + 3)
  } else if (src.source === 'open' && src.key) {
    more = openGenerate(src.key, n + 3)
  } else if (src.source === 'grade' && src.grade) {
    more = generateForGrade(src.grade, n + 3)
  } else if (src.source !== 'wrong') {
    more = generate(src.mode, src.difficulty, n + 3)
  }
  // 去掉与本次练习已出现过的重复题干
  const seen = new Set(list.value.map((x) => String(x.text)))
  more = more.filter((x) => !seen.has(String(x.text)))
  if (more.length < n && src.source === 'wrong') {
    more = more.concat([{ ...current.value }])
  }
  return more.slice(0, n)
}

const APPEND_LIMIT = 60

function settle(my) {
  const q = current.value
  const ok = isCorrect(q, my)
  // 先学再看：每做一道题记一次（前 20 道赚基础时间，之后每道 +1 分钟，规则开启时）
  const wr = getWatchRules()
  if (wr.on) addWatchEarned(1)
  if (ok) {
    rightCount.value++
    feedback.value = 'right'
    buzz(false)
    sfx('right')
    // 连对 5 题喊一次鼓励
    if (rightCount.value > 0 && rightCount.value % 5 === 0 && wrongList.value.length === 0) {
      sfx('combo', rightCount.value / 5)
      speak(CHEERS_STREAK[Math.floor(Math.random() * CHEERS_STREAK.length)])
    } else {
      // 每次答对都鼓励（speak 内部 2 秒节流，不会连播）
      cheerRight()
    }
  } else {
    wrongList.value.push({ text: q.text, answer: q.answer, your: my, type: q.type, options: q.options })
    addWrong({ text: q.text, answer: q.answer, mode: q.mode || cfg.value.mode, options: q.options, type: q.type })
    feedback.value = 'wrong'
    buzz(true)
    sfx('wrong')
    cheerWrong()
    // 错一题自动追加 2 道同类新题（总数跟着增加，防止一次性刷完就跑）
    if (list.value.length < APPEND_LIMIT) {
      const extra = makeSimilar(2)
      if (extra.length) list.value = list.value.concat(extra)
    }
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
  selLeft.value = null
  matched.value = new Set()
  matchedR.value = new Set()
  if (idx.value + 1 >= list.value.length) finish()
  else idx.value++
}

function finish() {
  if (tick) clearInterval(tick)
  tick = null

  const rec = {
    mode: cfg.value.source === 'wrong' ? 'wrong' : cfg.value.source === 'open' ? `O_${cfg.value.key}` : cfg.value.source === 'grade' ? `grade${cfg.value.grade}` : cfg.value.source === 'point' ? `P_${cfg.value.key}${cfg.value.fun ? '_fun' : ''}` : cfg.value.source === 'lemiao' ? `L_${cfg.value.key}` : cfg.value.mode,
    total: total.value,
    right: rightCount.value,
    durationMs: elapsed.value * 1000,
    wrong: wrongList.value,
    difficulty: cfg.value.difficulty,
    count: cfg.value.count,
    source: cfg.value.source,
    grade: cfg.value.grade,
    key: cfg.value.key
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
  padding-top: calc(max(env(safe-area-inset-top), var(--status-bar-height, 0px)) + 16rpx);
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
  padding: calc(8rpx + env(safe-area-inset-top)) 36rpx 8rpx;
  position: sticky;
  top: 0;
  z-index: 9;
  background: inherit;
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
  position: sticky;
  top: calc(88rpx + env(safe-area-inset-top));
  z-index: 9;
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
/* 选择/判断/比较题没有键盘，题卡整体上移一点，避免偏下 */
.stage.lift {
  padding-bottom: 14vh;
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
.mark-sub {
  font-size: 24rpx;
  color: #a79c92;
  margin-top: 8rpx;
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

/* —— 图形化说题 —— */
.qvisual {
  display: flex;
  justify-content: center;
  margin-bottom: 26rpx;
}
.tf {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  background: #fff8ef;
  border: 4rpx solid #f2c98c;
  border-radius: 20rpx;
  padding: 16rpx 20rpx;
}
.tf-row {
  display: flex;
  gap: 12rpx;
}
.tf-cell {
  width: 86rpx;
  height: 86rpx;
  background: #fff;
  border: 3rpx dashed #e8c28a;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tf-icon {
  font-size: 46rpx;
  line-height: 1;
}
.dices {
  display: flex;
  gap: 34rpx;
}
.dice {
  width: 150rpx;
  height: 150rpx;
  background: #fff;
  border: 4rpx solid #e6ddd0;
  border-radius: 26rpx;
  box-shadow: 0 8rpx 20rpx rgba(150, 120, 80, 0.12);
  display: flex;
  flex-wrap: wrap;
  padding: 14rpx;
  box-sizing: border-box;
}
.pip-slot {
  width: 33.33%;
  height: 33.33%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pip {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #ff7a3c;
}
.dots {
  max-width: 560rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10rpx;
}
.dot {
  font-size: 48rpx;
  line-height: 1.15;
}
/* 分组物件图：两组框分开 */
.dots-group {
  display: flex;
  gap: 26rpx;
  align-items: center;
}
.dotbox {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8rpx;
  max-width: 300rpx;
  background: #fff8ef;
  border: 3rpx dashed #e8c28a;
  border-radius: 18rpx;
  padding: 14rpx 18rpx;
}
/* 分合式：7 劈叉分开 */
.bond {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.bond-top {
  font-size: 64rpx;
  font-weight: 900;
  color: #e86a10;
  background: #fff;
  border: 3rpx solid #ffd9ae;
  border-radius: 20rpx;
  padding: 6rpx 30rpx;
  line-height: 1.3;
}
.bond-fork {
  display: flex;
  justify-content: center;
  width: 220rpx;
  height: 64rpx;
}
.bond-line {
  width: 110rpx;
  height: 5rpx;
  background: #d8a06a;
  margin-top: 30rpx;
}
.bond-line.l {
  transform: rotate(-28deg);
  transform-origin: right center;
}
.bond-line.r {
  transform: rotate(28deg);
  transform-origin: left center;
}
.bond-nums {
  display: flex;
  gap: 180rpx;
  margin-top: 4rpx;
}
.bond-num {
  min-width: 80rpx;
  font-size: 52rpx;
  font-weight: 900;
  color: #332c26;
  text-align: center;
  background: #f8f5f0;
  border-radius: 16rpx;
  padding: 4rpx 18rpx;
}
.bond-num.q {
  color: #ff9a4d;
}
/* 凑十法图形化 */
.mt-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
}
.mt-num {
  font-size: 64rpx;
  font-weight: 900;
  color: #332c26;
  background: #f8f5f0;
  border-radius: 20rpx;
  padding: 6rpx 30rpx;
}
.mt-num.mt-b {
  color: #e86a10;
  background: #fff;
  border: 3rpx solid #ffd9ae;
}
.mt-plus {
  font-size: 48rpx;
  font-weight: 800;
  color: #b3a897;
}
.mt-step {
  margin-top: 18rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #c46a1d;
  background: #fff3e2;
  border-radius: 100rpx;
  padding: 10rpx 28rpx;
}

/* —— 配对玩法 —— */
.match {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.match-cols {
  display: flex;
  gap: 40rpx;
  width: 100%;
}
.match-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.mcell {
  height: 104rpx;
  background: #f8f5f0;
  border: 3rpx solid #eee5d8;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 800;
  color: #332c26;
  white-space: nowrap;
  padding: 0 8rpx;
  box-sizing: border-box;
}
.mcell.sel {
  background: #ffe9d6;
  border-color: #ff9a4d;
  color: #e86a10;
}
.mcell.done {
  background: #e6f7ea;
  border-color: #8fdca4;
  color: #b8cfbe;
  pointer-events: none;
}
.mcell.shake {
  animation: shake 0.35s;
  border-color: #f56c6c;
  background: #fdecec;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10rpx); }
  50% { transform: translateX(10rpx); }
  75% { transform: translateX(-6rpx); }
}
.match-hint {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #b3a897;
}

.pad {
  display: flex;
  flex-wrap: wrap;
  padding: 10rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  margin-bottom: 5vh;
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
