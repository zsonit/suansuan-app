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
</style>
