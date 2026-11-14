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
          <text class="row-desc">开启后无论退到桌面还是其他应用，都会自动回到算算星球；省电模式、待机、锁屏状态下同样有效，关闭需要密码</text>
        </view>
        <switch :checked="kioskOn" color="#FF7A3D" @change="onKiosk" />
      </view>
      <!-- 无障碍没开时的分步引导：安卓 13 起侧载应用要先「允许受限制的设置」 -->
      <view class="a11y-box" v-if="kioskOn && !serviceOn">
        <view class="a11y-h">⚠ 无障碍服务没开，自动拉回现在是失效的</view>
        <view class="a11y-sub">照着下面做，开完返回本页会自动检测</view>

        <view class="a11y-step" v-if="a11y.restrictedPossible">
          <view class="a11y-num">1</view>
          <view class="a11y-main">
            <text class="a11y-t">先「允许受限制的设置」</text>
            <text class="a11y-d">安卓 13 起，用文件/微信/浏览器装的 APK 会被系统限制无障碍。点右边按钮进入本应用信息页 → 右上角 <text class="a11y-code">⋮</text> → 点「允许受限制的设置」→ 确认</text>
          </view>
          <view class="perm-btn" @click="goAppInfo">去允许</view>
        </view>

        <view class="a11y-step">
          <view class="a11y-num">{{ a11y.restrictedPossible ? 2 : 1 }}</view>
          <view class="a11y-main">
            <text class="a11y-t">开启「算算星球 · 专注锁定」</text>
            <text class="a11y-d">无障碍（已下载的服务 / 已安装的应用）→ 找到算算星球 → 打开开关 → 弹窗点「允许」</text>
          </view>
          <view class="perm-btn" @click="goA11y">去开启</view>
        </view>

        <view class="a11y-tip">
          提示：每次覆盖安装新版本，系统会把无障碍自动关掉，更新后需要回来再开一次。
          <text v-if="a11y.restrictedPossible">开关是灰的、或点了弹「出于安全考虑不可用」，就是第 1 步没做。</text>
          <text v-else>列表里找不到算算星球时，先用文件管理器重新安装一次这个 APK。</text>
        </view>

        <view class="a11y-alt">
          实在开不了：往下滑到「备用监控」，授权「使用情况访问」也能锁住，不需要无障碍。
        </view>

        <view class="a11y-refresh" @click="refreshA11y">
          {{ a11yChecked ? '↻ 还是没开？重新检测' : '↻ 我已经开好了，重新检测' }}
        </view>
      </view>
      <view class="row" v-if="kioskOn" @click="openUnlock('reset')">
        <view class="row-main">
          <text class="row-title">修改密码 / 关闭锁定</text>
          <text class="row-desc">需要输入锁定密码，忘记密码可用恢复码或安全问题找回</text>
        </view>
        <text class="row-chev">›</text>
      </view>
    </view>

    <!-- 备用监控：无障碍彻底开不了时的替代方案 -->
    <view class="group" v-if="kioskOn">
      <view class="group-title">备用监控 · 无障碍开不了时用</view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">开启备用监控</text>
          <text class="row-desc">不依赖无障碍服务。用系统「使用情况访问」每 2 秒看一次当前应用，孩子切到别的 APP 或桌面就拉回练习页</text>
        </view>
        <switch :checked="wd.on" color="#FF7A3D" @change="onWatchdog" />
      </view>
      <view class="row" v-if="!wd.usage" @click="goUsage">
        <view class="row-main">
          <text class="row-title warn">① 先给「使用情况访问」权限</text>
          <text class="row-desc">系统设置 → 特殊应用权限 → 使用情况访问 → 算算星球 → 允许（不同品牌叫法略有差异）</text>
        </view>
        <view class="perm-btn">去授权</view>
      </view>
      <view class="row" v-else>
        <view class="row-main">
          <text class="row-title">使用情况访问</text>
          <text class="row-desc">已授权 ✓ {{ wd.running ? (wd.a11y ? '（监控服务运行中，与无障碍自动分工）' : '（监控服务运行中，正在守护）') : '（服务还没起来，点下面「刷新状态」自动恢复）' }}</text>
        </view>
      </view>
      <view class="row" v-if="wd.usage && !wd.overlay" @click="goOverlay">
        <view class="row-main">
          <text class="row-title warn">② 再开「悬浮窗」权限（重要）</text>
          <text class="row-desc">安卓 10 以上没有悬浮窗，监控在孩子玩别的 APP 时无法直接把练习页弹回来。开了它拉回才稳</text>
        </view>
        <view class="perm-btn">去授权</view>
      </view>
      <view class="row" @click="refreshWatchdog">
        <view class="row-main">
          <text class="row-title">刷新状态 / 自动修复</text>
          <text class="row-desc">授权完回来点一下。监控开关开着但服务没在跑时，会自动把它拉起来</text>
        </view>
        <text class="row-chev">↻</text>
      </view>
      <view class="a11y-tip" style="margin: 4rpx 0 18rpx">
        提示：备用监控会常驻一条「算算星球正在守护中」的通知，这是正常的（系统要求）。部分手机还需要允许「自启动」并在后台保活，否则会被省电策略杀掉。
      </view>
    </view>

    <!-- 检修日志：带开关，可导出 -->
    <view class="group">
      <view class="group-title">检修日志</view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">记录检修日志</text>
          <text class="row-desc">记录锁定、无障碍、拉回、云端指令等关键事件；出问题时打开复现一次，再导出给人看</text>
        </view>
        <switch :checked="diag.on" color="#FF7A3D" @change="onDiag" />
      </view>
      <view class="row" @click="goLog">
        <view class="row-main">
          <text class="row-title">查看日志</text>
          <text class="row-desc">{{ diag.size ? '当前约 ' + diagSizeText : '还没有记录' }}</text>
        </view>
        <text class="row-chev">›</text>
      </view>
      <view class="row" @click="doExport">
        <view class="row-main">
          <text class="row-title">导出日志</text>
          <text class="row-desc">生成 txt 文件（含设备信息），可直接分享到微信、QQ 或存到文件</text>
        </view>
        <view class="perm-btn">导出</view>
      </view>
      <view class="row" @click="doClearLog">
        <view class="row-main">
          <text class="row-title">清空日志</text>
          <text class="row-desc">清空后不可恢复</text>
        </view>
        <text class="row-chev">›</text>
      </view>
    </view>

    <!-- 任何模式下都能弹回：系统权限（省电、待机、锁屏） -->
    <view class="group" v-if="kioskOn">
      <view class="group-title">任何模式都能弹回 · 系统权限</view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">忽略电池优化（省电模式）</text>
          <text class="row-desc">不加入白名单的话，省电模式或后台待机时可能拉不回来</text>
        </view>
        <view class="perm-btn" :class="{ ok: power.batteryIgnored }" @click="goBattery">
          {{ power.batteryIgnored ? '已开启 ✓' : '去开启' }}
        </view>
      </view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">悬浮窗 / 允许后台弹出</text>
          <text class="row-desc">Android 10 以后限制后台启动应用，给这个权限才能随时弹到最前</text>
        </view>
        <view class="perm-btn" :class="{ ok: power.overlay }" @click="goOverlay">
          {{ power.overlay ? '已开启 ✓' : '去开启' }}
        </view>
      </view>
      <view class="row" @click="goAutoStart">
        <view class="row-main">
          <text class="row-title">自启动 / 后台运行</text>
          <text class="row-desc">小米、华为、OPPO、vivo 等手机建议把算算星球设为允许自启动，否则被杀掉后不弹</text>
        </view>
        <text class="row-chev">›</text>
      </view>
      <view class="row" @click="refreshPower" v-if="!power.batteryIgnored || !power.overlay">
        <view class="row-main">
          <text class="row-title warn">⚠ 还有权限没开</text>
          <text class="row-desc">设置完回来点这里刷新状态；开着省电模式也能正常弹回了</text>
        </view>
        <text class="row-chev">↻</text>
      </view>
    </view>

    <!-- 家长远程控制：扫码配对，外出也能实时控制这台设备 -->
    <view class="group">
      <view class="group-title">家长远程控制（配对后外出也能管）</view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">开启家长远程控制</text>
          <text class="row-desc">家长手机扫码或输配对码绑定后，可远程临时解锁、立即锁定、改规则、留言、看做题报告；断网时一切照旧不影响</text>
        </view>
        <switch :checked="remote.on" color="#FF7A3D" @change="onRemoteSwitch" />
      </view>
      <template v-if="remote.on">
        <view class="row">
          <view class="row-main">
            <text class="row-title">设备名称</text>
            <text class="row-desc">给这台设备起个名，家长端会显示（如：哥哥的平板）</text>
          </view>
          <input class="gate-input" style="width: 260rpx" v-model="remoteName" maxlength="12" placeholder="哥哥的平板" @blur="saveRemoteName" />
        </view>
        <view class="row">
          <view class="row-main">
            <text class="row-title">配对码</text>
            <text class="row-desc">家长端输入这串码即可绑定这台设备（一次绑定永久有效）</text>
          </view>
          <text class="pair-code">{{ remote.code || '--------' }}</text>
        </view>
        <view class="qr-wrap" v-if="remoteQr">
          <image class="qr-img" :src="remoteQr" mode="widthFix" />
          <text class="row-desc">家长手机扫码直接打开控制台并绑定</text>
        </view>
        <view class="row">
          <view class="row-main">
            <text class="row-title">连接状态</text>
            <text class="row-desc">{{ remoteStatusText }}</text>
          </view>
          <text class="row-chev" @click="refreshRemote">↻</text>
        </view>
      </template>
    </view>

    <view class="group">
      <view class="group-title">先学再看 · 答题解锁使用时间</view>
      <view class="row">
        <view class="row-main">
          <text class="row-title">答题解锁使用时间</text>
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
            <text class="row-desc">使用时间用完被拉回后，强制做 10 道题才能继续看，做完可接着挑战赚时间</text>
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
          <text class="sheet-title">{{ unlockPurpose === 'enable' ? '输入密码开启' : unlockPurpose === 'watch' ? '输入密码修改规则' : unlockPurpose === 'reset' ? '修改密码 / 关闭锁定' : '彻底关闭专注锁定' }}</text>

          <!-- 关闭锁定：双重验证（先答安全问题，再输密码） -->
          <template v-if="unlockPurpose === 'disable' && !forgotMode">
            <template v-if="closeStep === 'answer'">
              <text class="sheet-desc">彻底关闭需要双重验证。请先回答安全问题：{{ (cfg && cfg.question) || '开启时设置的问题' }}</text>
              <input class="pin-input" v-model="closeAnswer" placeholder="安全问题答案 / 手机号" />
              <text class="err" v-if="closeErr">{{ closeErr }}</text>
              <view class="sheet-btns">
                <view class="sbtn ghost" @click="cancelOverlay">取消</view>
                <view class="sbtn" @click="closeAnswerNext">下一步</view>
              </view>
            </template>
            <template v-else>
              <text class="sheet-desc">✅ 答案正确，最后输入锁定密码</text>
              <input class="pin-input" type="number" :password="true" maxlength="6" v-model="unlockPin" placeholder="锁定密码" />
              <text class="err" v-if="closeErr">{{ closeErr }}</text>
              <view class="sheet-btns">
                <view class="sbtn ghost" @click="closeStep = 'answer'">上一步</view>
                <view class="sbtn danger" @click="closeFinal">关闭锁定</view>
              </view>
            </template>
          </template>

          <template v-else-if="!forgotMode">
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
            <text class="sheet-desc">✅ 身份验证通过，可以重置密码（关闭锁定请回上一级走「答案 + 密码」双重验证）</text>
            <view class="sheet-btns col">
              <view class="sbtn" @click="startResetFromForgot">重置密码</view>
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
  sha256, lockoutLeft, addWrongAttempt, resetAttempts, a11yStatus, openAppInfo,
  getPowerStatus, openBatterySettings, openOverlaySettings, openAutoStartSettings,
  watchdogStatus, setWatchdog, openUsageAccessSettings
} from '@/common/kiosk'
import {
  diagStatus, setDiag, exportLog, clearLog, logLine
} from '@/common/diag'
import {
  CONSOLE_URL, getRemoteCfg, enableRemote, disableRemote, setRemoteName,
  remoteStatus, start as startRemote
} from '@/common/remote'

const goals = [10, 20, 30, 50]
const settings = ref(getSettings())
const eyeCare = computed(() => settings.value.eyeCare)

// ===== 专注锁定 =====
const kioskOn = ref(false)
const serviceOn = ref(false)
// 无障碍体检结果（是否受限设置 / 安卓版本）
const a11y = ref({ on: false, declared: false, sdk: 0, targetSdk: 0, installer: '', restrictedPossible: false })
const a11yChecked = ref(false)
// 备用监控（使用情况访问）
const wd = ref({ usage: false, on: false, a11y: false })
// 检修日志
const diag = ref({ on: false, size: 0 })
const diagSizeText = computed(() => {
  const k = Math.round((diag.value.size || 0) / 1024)
  return k > 0 ? k + ' KB' : '不到 1 KB'
})
// 系统权限：忽略电池优化 / 悬浮窗（后台弹出）
const power = ref({ batteryIgnored: true, overlay: true })
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
// 彻底关闭锁定：两步验证（安全问题答案 → 锁定密码）
const closeStep = ref('answer') // answer | pin
const closeAnswer = ref('')
const closeErr = ref('')

onShow(async () => {
  settings.value = getSettings()
  kioskOn.value = await isEnabled()
  await refreshA11y()
  cfg.value = await getConfig()
  power.value = await getPowerStatus()
  refreshRemote()
  refreshWatchdog()
  refreshDiag()
})

// ===== 无障碍：状态体检与引导 =====
async function refreshA11y() {
  try {
    a11y.value = await a11yStatus()
    serviceOn.value = !!a11y.value.on
    a11yChecked.value = true
  } catch (e) {
    serviceOn.value = await isServiceOn()
  }
}
function goAppInfo() {
  openAppInfo()
}

// ===== 备用监控 =====
async function refreshWatchdog() {
  try {
    const old = wd.value
    wd.value = await watchdogStatus()
    if (old.on && !old.running && wd.value.running) {
      uni.showToast({ title: '已自动恢复监控服务', icon: 'success' })
    }
  } catch (e) {
    wd.value = { usage: false, on: false, a11y: false, running: false, overlay: true }
  }
}
async function onWatchdog(e) {
  const want = !!e.detail.value
  if (want && !wd.value.usage) {
    uni.showToast({ title: '请先授权使用情况访问', icon: 'none' })
    goUsage()
    return
  }
  const on = await setWatchdog(want)
  wd.value = { ...wd.value, on }
  logLine('watchdog', want ? '设置页开启备用监控' : '设置页关闭备用监控')
  uni.showToast({ title: want ? '备用监控已开启' : '已关闭', icon: 'success' })
  setTimeout(refreshWatchdog, 800)
}
async function goUsage() {
  await openUsageAccessSettings()
  setTimeout(refreshWatchdog, 1500)
}

// ===== 检修日志 =====
async function refreshDiag() {
  diag.value = await diagStatus()
}
async function onDiag(e) {
  const on = !!e.detail.value
  await setDiag(on)
  diag.value = await diagStatus()
  if (on) logLine('diag', '家长打开检修日志')
  uni.showToast({ title: on ? '开始记录' : '已停止记录', icon: 'success' })
}
function goLog() {
  uni.navigateTo({ url: '/pages/log/index' })
}
async function doExport() {
  uni.showLoading({ title: '生成中…' })
  const r = await exportLog()
  uni.hideLoading()
  if (r && r.path) {
    uni.showToast({ title: '已打开分享', icon: 'success' })
  } else if (r && r.text) {
    uni.setClipboardData({
      data: r.text,
      success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    })
  } else {
    uni.showToast({ title: '导出失败，请稍后再试', icon: 'none' })
  }
  refreshDiag()
}
function doClearLog() {
  uni.showModal({
    title: '清空检修日志？',
    content: '清空后不可恢复',
    confirmText: '清空',
    confirmColor: '#ff6b6b',
    success: async (r) => {
      if (!r.confirm) return
      await clearLog()
      await refreshDiag()
      uni.showToast({ title: '已清空', icon: 'success' })
    }
  })
}

// ===== 家长远程控制 =====
const remote = ref({ on: false, code: '', name: '' })
const remoteName = ref('')
const remoteQr = ref('')
const remoteStatusText = ref('未开启')

async function refreshRemote() {
  const st = remoteStatus()
  remote.value = { on: st.on, code: st.code, name: st.name }
  if (!st.on) {
    remoteStatusText.value = '未开启'
    remoteQr.value = ''
    return
  }
  remoteName.value = st.name
  if (st.status === 'ok') {
    remoteStatusText.value = '已连接云端，家长端可以控制了'
  } else if (st.status === 'err') {
    remoteStatusText.value = '云端暂时连不上，本地一切照旧，稍后自动重试'
  } else {
    remoteStatusText.value = '连接中…'
  }
  // 二维码：家长扫码直达控制台并带上配对码
  if (!remoteQr.value && st.code) {
    try {
      const QR = await import('qrcode')
      remoteQr.value = await QR.toDataURL(CONSOLE_URL + '/?c=' + st.code, { width: 360, margin: 1 })
    } catch (e) {
      remoteQr.value = ''
    }
  }
}

function onRemoteSwitch(e) {
  if (e.detail.value) {
    const cfg2 = enableRemote(remoteName.value || remote.value.name)
    remote.value = { on: true, code: cfg2.code, name: cfg2.name }
    remoteName.value = cfg2.name
    startRemote()
  } else {
    disableRemote()
  }
  refreshRemote()
}

function saveRemoteName() {
  if (remoteName.value && remoteName.value !== remote.value.name) {
    setRemoteName(remoteName.value)
    refreshRemote()
  }
}

// ===== 系统权限：任何模式（省电/待机/锁屏）都能弹回 =====
async function goBattery() {
  await openBatterySettings()
}
async function goOverlay() {
  await openOverlaySettings()
}
async function goAutoStart() {
  await openAutoStartSettings()
}
async function refreshPower() {
  power.value = await getPowerStatus()
}

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
  await refreshA11y()
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
    // 彻底关闭锁定：必须「安全问题答案 + 锁定密码」双重验证，孩子知道密码也关不掉
    unlockPurpose.value = 'disable'
    overlay.value = 'unlock'
    forgotMode.value = null
    unlockPin.value = ''
    unlockErr.value = ''
    closeStep.value = 'answer'
    closeAnswer.value = ''
    closeErr.value = ''
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
    await refreshA11y()
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
  // 系统设置回来时 onShow 会自动重新检测；这里延时再补一次，部分机型 onShow 早于服务启动
  setTimeout(refreshA11y, 1500)
}

function openUnlock(purpose) {
  unlockPurpose.value = purpose
  overlay.value = 'unlock'
  forgotMode.value = null
  unlockPin.value = ''
  unlockErr.value = ''
  recoveryIn.value = ''
  answerIn.value = ''
  closeStep.value = 'answer'
  closeAnswer.value = ''
  closeErr.value = ''
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

// 关闭锁定第一步：核对安全问题答案（也接受手机号）
async function closeAnswerNext() {
  const left = lockoutLeft()
  if (left > 0) {
    closeErr.value = '错误次数过多，请 ' + Math.ceil(left / 60000) + ' 分钟后再试'
    return
  }
  const c = cfg.value
  if (!c) {
    closeErr.value = '未找到锁定配置'
    return
  }
  const ok = (await verifyAnswer(c, closeAnswer.value)) || (await verifyPhone(c, closeAnswer.value))
  if (!ok) {
    const n = addWrongAttempt()
    closeErr.value = n >= 5 ? '错误次数过多，已锁定 5 分钟' : '答案不对（第 ' + n + ' 次错误）'
    closeAnswer.value = ''
    return
  }
  resetAttempts()
  closeAnswer.value = ''
  closeErr.value = ''
  closeStep.value = 'pin' // 进入第二步输密码
}

// 关闭锁定第二步：锁定密码正确才真正关闭
async function closeFinal() {
  const left = lockoutLeft()
  if (left > 0) {
    closeErr.value = '错误次数过多，请 ' + Math.ceil(left / 60000) + ' 分钟后再试'
    return
  }
  const c = cfg.value
  if (!c || !(await verifyPin(c, unlockPin.value))) {
    const n = addWrongAttempt()
    closeErr.value = n >= 5 ? '错误次数过多，已锁定 5 分钟' : '密码不对（第 ' + n + ' 次错误）'
    unlockPin.value = ''
    return
  }
  resetAttempts()
  unlockPin.value = ''
  disposeUnlock()
}

// 双重验证通过后才关闭（不经过通用 applyUnlock，避免绕过第一步）
async function disposeUnlock() {
  await disableKiosk()
  closeErr.value = ''
  closeStep.value = 'answer'
}

async function submitRecovery() {  const c = cfg.value
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
      await refreshA11y()
      if (!serviceOn.value) goA11y()
    })
  } else if (unlockPurpose.value === 'reset') {
    startSetup()
  } else if (unlockPurpose.value === 'watch') {
    applyWatchPending()
    overlay.value = null
  }
  // disable 不走这里：必须经 closeFinal 完成「答案 + 密码」双重验证
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
/* 系统权限按钮：未开启=橙色「去开启」，已开启=绿色打勾 */
.perm-btn {
  flex: none;
  margin-left: 16rpx;
  padding: 10rpx 22rpx;
  border-radius: 100rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  box-shadow: 0 6rpx 16rpx rgba(255, 122, 61, 0.28);
  white-space: nowrap;
}
.perm-btn.ok {
  color: #2fbf87;
  background: #e8faf1;
  box-shadow: none;
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

/* ===== 无障碍引导 ===== */
.a11y-box {
  margin: 6rpx 0 18rpx;
  padding: 26rpx 24rpx 20rpx;
  border-radius: 22rpx;
  background: linear-gradient(180deg, #fff6ef, #fffaf6);
  border: 2rpx solid #ffdcc4;
}
.a11y-h {
  font-size: 28rpx;
  font-weight: 800;
  color: #e2622a;
  line-height: 1.5;
}
.a11y-sub {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #b08d76;
}
.a11y-step {
  display: flex;
  align-items: flex-start;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 2rpx dashed #ffdfc9;
}
.a11y-num {
  flex: none;
  width: 38rpx;
  height: 38rpx;
  margin-right: 14rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  text-align: center;
  line-height: 38rpx;
}
.a11y-main {
  flex: 1;
  min-width: 0;
}
.a11y-t {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #332c26;
  line-height: 1.5;
}
.a11y-d {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #9a8b7e;
  line-height: 1.65;
}
.a11y-code {
  font-weight: 800;
  color: #e2622a;
}
.a11y-tip {
  margin-top: 18rpx;
  padding: 14rpx 16rpx;
  border-radius: 14rpx;
  background: #fff;
  font-size: 20rpx;
  color: #a39285;
  line-height: 1.7;
}
.a11y-alt {
  margin-top: 14rpx;
  padding: 12rpx 16rpx;
  border-radius: 12rpx;
  background: #fff3e9;
  font-size: 20rpx;
  color: #c1783f;
  line-height: 1.65;
}
.a11y-refresh {
  margin-top: 16rpx;
  padding: 16rpx 0;
  text-align: center;
  border-radius: 100rpx;
  border: 2rpx solid #ffcdae;
  color: #e2622a;
  font-size: 24rpx;
  font-weight: 700;
  background: #fff;
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

/* 家长远程控制：配对码与二维码 */
.pair-code {
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  color: #ff7a3d;
  font-family: 'SFMono-Regular', Consolas, monospace;
}

.qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0 8rpx;
  gap: 12rpx;
}

.qr-img {
  width: 320rpx;
  height: 320rpx;
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid #f0e4d5;
}
</style>
