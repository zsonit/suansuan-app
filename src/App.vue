<script>
import { getSettings } from '@/common/store'

export default {
  onLaunch() {
    // 首次启动写入默认设置，确保各页读取一致
    getSettings()
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
