<script>
import { getSettings, getWatchRules, getUnlockUntil } from '@/common/store'
import { isServiceOn, takeForceChallenge } from '@/common/kiosk'
import { remoteStatus, start as startRemote, stop as stopRemote } from '@/common/remote'

export default {
  onLaunch() {
    // 首次启动写入默认设置，确保各页读取一致
    getSettings()
  },
  async onShow() {
    // 家长远程控制：App 在前台时每 6 秒轮询云端指令（后台时轮询暂停，断网静默跳过）
    if (remoteStatus().on) startRemote()

    // 先学再看：解锁时间到，无障碍服务把孩子拉回 App 时，
    // 强制进入挑战赛（10 道按年级随机题，做完才能继续看，做完还可继续挑战赚时间）
    try {
      const rules = getWatchRules()
      if (!rules.on) return
      const pages = getCurrentPages()
      const cur = pages[pages.length - 1]
      const route = cur && cur.route ? String(cur.route) : ''
      // 已经在练习页/结果页就不打断（孩子正在做题，做的不算白做）
      if (route.indexOf('pages/practice/index') > -1 || route.indexOf('pages/result/index') > -1) return

      // 无障碍服务拉起时写了强制挑战标记：省电模式/进程被杀重启后同样生效
      const forced = await takeForceChallenge()
      if (forced) {
        uni.redirectTo({ url: '/pages/practice/index?source=challenge&count=10' })
        return
      }

      const until = getUnlockUntil()
      if (!until) return
      const now = Date.now()
      if (until > now || now - until > 5 * 60 * 1000) return // 未到期或早就过期的不弹
      const svc = await isServiceOn()
      if (!svc) return
      uni.redirectTo({ url: '/pages/practice/index?source=challenge&count=10' })
    } catch (e) {
      /* 静默失败，不影响正常使用 */
    }
  }
}
</script>

<style>
/* 全局基础样式：统一字体与页面底色，避免白屏闪一下 */
page {
  background-color: #fff9f0;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei',
    sans-serif;
  color: #332c26;
  -webkit-font-smoothing: antialiased;
}

view,
text {
  box-sizing: border-box;
}

/* #ifdef H5 */
/* 底部导航栏：加大字体与高度（uni 默认 20px 太小，孩子看不清） */
uni-tabbar {
  height: 68px !important;
}
uni-tabbar .uni-tabbar__item {
  height: 68px !important;
  padding-top: 6px !important;
}
uni-tabbar .uni-tabbar__label {
  font-size: 21px !important;
  font-weight: 600 !important;
  margin-top: 4px !important;
  letter-spacing: 1px;
}
uni-tabbar .uni-tabbar__bd {
  height: 68px !important;
}
/* #endif */

/* ===================== 多设备屏幕适配 ===================== */
/* 手机竖屏：保持原始 750 设计稿布局（rpx 按屏宽换算，天然适配） */
/* 平板横屏 / 电视 / 显示器：内容限宽居中成「大平板」布局，不铺满不拉伸 */
@media (orientation: landscape) and (min-width: 700px) {
  uni-page-body {
    background: #f3e7d6;
  }
  uni-page-body > .page {
    max-width: 1000px;
    margin: 0 auto;
    min-height: 100vh;
    box-shadow: 0 0 60px rgba(90, 60, 30, 0.12);
  }
  uni-tabbar {
    max-width: 1000px !important;
    margin: 0 auto;
    left: 0 !important;
    right: 0 !important;
  }
}
</style>
