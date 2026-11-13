<script>
import { getSettings, getWatchRules, getUnlockUntil } from '@/common/store'
import { isServiceOn } from '@/common/kiosk'

export default {
  onLaunch() {
    // 首次启动写入默认设置，确保各页读取一致
    getSettings()
  },
  async onShow() {
    // 先学再看：解锁时间到，无障碍服务把孩子拉回 App 时，
    // 自动弹出「续时挑战」页（选题卡 → 答对 10 题 → 赢 10 分钟继续看）
    try {
      const rules = getWatchRules()
      if (!rules.on) return
      const until = getUnlockUntil()
      if (!until) return
      const now = Date.now()
      if (until > now || now - until > 5 * 60 * 1000) return // 未到期或早就过期的不弹
      const svc = await isServiceOn()
      if (!svc) return
      const pages = getCurrentPages()
      const cur = pages[pages.length - 1]
      if (cur && cur.route && String(cur.route).indexOf('pages/breakin/index') > -1) return
      uni.redirectTo({ url: '/pages/breakin/index' })
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
</style>
