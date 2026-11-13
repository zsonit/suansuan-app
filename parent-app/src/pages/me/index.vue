<template>
  <view class="page">
    <view class="hd">
      <view class="hd-row">
        <view class="back" @click="back">‹</view>
        <view class="hd-title">关于家长端</view>
      </view>
      <view class="hd-sub">算算星球 · 家长端</view>
    </view>

    <view class="hero">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <view class="brand">
        <text class="bn">算算星球 家长端</text>
        <text class="bv">v{{ ver }} · 安卓 / 苹果通用</text>
      </view>
    </view>

    <view class="card">
      <view class="card-t">能做什么</view>
      <view class="li"><text class="ic">⏱</text><text class="lt">查看每台设备今天还能用多久、已用多久</text></view>
      <view class="li"><text class="ic">🔓</text><text class="lt">临时解锁 5 分钟~2 小时（不扣孩子攒的时间）</text></view>
      <view class="li"><text class="ic">🚫</text><text class="lt">立即锁定，让孩子马上回到算算星球</text></view>
      <view class="li"><text class="ic">⚙️</text><text class="lt">远程改规则：每日题数/奖励时长/挑战门槛/每题奖励</text></view>
      <view class="li"><text class="ic">📚</text><text class="lt">设定题目年级，按年级出题</text></view>
      <view class="li"><text class="ic">💬</text><text class="lt">给孩子留言，设备上直接弹窗</text></view>
      <view class="li"><text class="ic">📊</text><text class="lt">做题报告：正确率、用时、每道错题的题干与正确答案</text></view>
    </view>

    <view class="card">
      <view class="card-t">怎么开始</view>
      <view class="step">
        <text class="sn">1</text>
        <text class="st">在孩子设备打开「算算星球 → 设置 → 家长远程控制」，开启后会出现 8 位配对码。</text>
      </view>
      <view class="step">
        <text class="sn">2</text>
        <text class="st">在首页输入这 8 位配对码完成绑定，之后永久有效，不用再配对。</text>
      </view>
      <view class="step">
        <text class="sn">3</text>
        <text class="st">有多个孩子 / 多台设备（手机、平板、电视）就分别绑定，每台都会单独显示。</text>
      </view>
      <view class="muted" style="margin-top: 12rpx">
        孩子设备需要联网才能被远程控制；断网时孩子设备本机的锁定与学习规则完全照常运行。
      </view>
    </view>

    <view class="card">
      <view class="card-t">
        <text>网页版控制台</text>
        <text class="hint">不想装 App 时用</text>
      </view>
      <view class="url">{{ webUrl }}</view>
      <view class="row2">
        <view class="btn ghost flex1 sm" @click="copyUrl">复制网址</view>
      </view>
      <view class="muted" style="margin-top: 12rpx">
        用手机或电脑浏览器打开上面网址，输入同样的配对码即可，绑定记录也留在该浏览器里。
      </view>
    </view>

    <view class="card">
      <view class="card-t">说明</view>
      <view class="muted">
        · 云端只做「叠加控制」：控制指令和报告同步走云端，孩子设备断网时所有本地规则（专注锁定、每日任务、挑战赛、家长门禁）均不受影响。
        {{ '\n' }}· 配对码是唯一凭证，请勿告诉孩子以外无关的人；建议定期在孩子设备上更换。
        {{ '\n' }}· 本 App 不含广告、不收集与学习无关的信息。
      </view>
    </view>

    <view class="ver muted">算算星球家长端 v{{ ver }}</view>
  </view>
</template>

<script>
import { WEB_CONSOLE, toast } from '@/common/cloud'

export default {
  data() {
    return {
      webUrl: WEB_CONSOLE,
      ver: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'
    }
  },
  methods: {
    back() {
      uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    },
    copyUrl() {
      uni.setClipboardData({
        data: this.webUrl,
        success: () => toast('网址已复制'),
        fail: () => toast('复制失败')
      })
    }
  }
}
</script>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff4e8, #ffe9d6);
  border-radius: 28rpx;
  padding: 30rpx;
  margin-top: 24rpx;
}
.logo {
  width: 110rpx;
  height: 110rpx;
  border-radius: 26rpx;
  background: #fff;
  margin-right: 24rpx;
  flex: none;
}
.brand {
  flex: 1;
}
.bn {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #7a3f14;
}
.bv {
  display: block;
  font-size: 23rpx;
  color: #b07a4e;
  margin-top: 8rpx;
}

.li {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 0;
  border-top: 1rpx solid #f6f1eb;
}
.li:first-of-type {
  border-top: none;
}
.ic {
  width: 46rpx;
  flex: none;
  font-size: 28rpx;
  line-height: 1.6;
}
.lt {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: #4a423a;
}

.step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14rpx;
}
.sn {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fff2e6;
  color: #ff7a3d;
  font-size: 23rpx;
  font-weight: 800;
  text-align: center;
  line-height: 40rpx;
  margin-right: 14rpx;
  flex: none;
}
.st {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: #4a423a;
}

.url {
  font-size: 26rpx;
  color: #ff7a3d;
  background: #fbf7f3;
  border: 1rpx solid #f2eae2;
  border-radius: 16rpx;
  padding: 20rpx;
  word-break: break-all;
  line-height: 1.5;
}
.row2 {
  display: flex;
  margin-top: 16rpx;
}
.flex1 {
  flex: 1;
}
.ver {
  text-align: center;
  margin-top: 40rpx;
}
</style>
