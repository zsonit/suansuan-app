<script>
import { listBound, refreshAll } from '@/common/cloud'

export default {
  onLaunch() {
    // 启动时先本地渲染（断网也能看到已绑定设备），再后台刷新
    refreshAll(listBound().map((d) => d.code)).catch(() => {})
  }
}
</script>

<style>
/* ===================== 全局基础 ===================== */
page {
  background-color: #f6f4f1;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei',
    sans-serif;
  color: #2a2622;
  -webkit-font-smoothing: antialiased;
}

view,
text,
input,
textarea {
  box-sizing: border-box;
}

/* ===================== 通用组件样式（各页共用） ===================== */
.page {
  min-height: 100vh;
  padding: 0 32rpx calc(60rpx + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

/* 顶部标题区：安全区 + 大标题 */
.hd {
  padding: calc(28rpx + env(safe-area-inset-top, 0px)) 0 8rpx;
}
.hd-row {
  display: flex;
  align-items: center;
}
.hd-title {
  font-size: 46rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
  flex: 1;
}
.hd-sub {
  font-size: 24rpx;
  color: #9a9088;
  margin-top: 8rpx;
}
.back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #6b6259;
  margin-right: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(120, 100, 80, 0.08);
}

/* 卡片 */
.card {
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-top: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(120, 100, 80, 0.06);
}
.card-t {
  font-size: 30rpx;
  font-weight: 800;
  margin-bottom: 18rpx;
  display: flex;
  align-items: center;
}
.card-t .hint {
  font-size: 22rpx;
  color: #a89e94;
  font-weight: 500;
  margin-left: auto;
}

/* 按钮 */
.btn {
  height: 88rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #ff9a5c, #ff7a3d);
  color: #fff;
}
.btn:active {
  opacity: 0.86;
}
.btn.ghost {
  background: #fff;
  color: #6b6259;
  border: 1rpx solid #ece5dd;
}
.btn.danger {
  background: #fff1ef;
  color: #e5544b;
  border: 1rpx solid #ffd8d3;
}
.btn.sm {
  height: 68rpx;
  font-size: 26rpx;
  border-radius: 18rpx;
  padding: 0 26rpx;
}
.btn.dis {
  opacity: 0.45;
}

/* 药丸选择 */
.pill {
  padding: 14rpx 26rpx;
  border-radius: 100rpx;
  background: #fff;
  border: 1rpx solid #ece5dd;
  font-size: 26rpx;
  font-weight: 700;
  color: #6b6259;
  margin: 0 14rpx 14rpx 0;
}
.pill.active {
  background: #ff7a3d;
  border-color: #ff7a3d;
  color: #fff;
}

/* 输入 */
.ipt {
  height: 88rpx;
  background: #f8f6f3;
  border: 1rpx solid #ece5dd;
  border-radius: 20rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #2a2622;
  flex: 1;
}

/* 文本 */
.muted {
  color: #9a9088;
  font-size: 24rpx;
  line-height: 1.7;
  white-space: pre-line;
}
.err {
  color: #e5544b;
  font-size: 24rpx;
  margin-top: 12rpx;
}
.ok {
  color: #2fbf87;
}

/* 点 */
.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #cfc7bf;
  margin-right: 10rpx;
}
.dot.on {
  background: #2fbf87;
  box-shadow: 0 0 0 6rpx rgba(47, 191, 135, 0.16);
}

/* 空态 */
.empty {
  text-align: center;
  padding: 60rpx 30rpx;
  color: #a89e94;
  font-size: 26rpx;
  line-height: 1.8;
  white-space: pre-line;
}

/* ===================== 多设备适配（平板/折叠屏/大屏手机） ===================== */
/* rpx 已按 750 设计稿等比换算，宽度上限在 manifest 的 rpxCalcMaxDeviceWidth 收口，
   这里只做「宽屏居中限宽」，避免平板上卡片被拉得过宽 */
@media (min-width: 700px) {
  .page {
    max-width: 820px;
    margin: 0 auto;
  }
}
</style>
