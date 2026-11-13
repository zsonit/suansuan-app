package cn.zsonit.suansuan;

import android.accessibilityservice.AccessibilityService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;

/**
 * 专注锁定服务（家长控制）：
 * 锁定开启时，只要前台不是算算星球（任何 APP、游戏、视频、桌面都算），就把算算星球拉回前台。
 * 除了窗口切换时立即拉回，还每 3 秒巡检一次：
 * 孩子解锁时间在看别的 APP 时到点（没有切窗口事件），也能及时拉回来做续时挑战。
 * 只有 SharedPreferences("kiosk") 的 enabled 为 true 时才生效；
 * suspendUntil / unlock_until 期间（家长临时解锁、先学再看自由时间）不拉回。
 *
 * 省电模式 / Doze / 熄屏 / 锁屏 适配：
 * 1) 拉起前先申请短时 WakeLock 点亮屏幕（省电模式、熄屏状态下也能弹出来）；
 * 2) 注册 SCREEN_ON / USER_PRESENT 广播，用户一按亮屏或解锁就立刻检查一次；
 * 3) 拉起时带 kiosk_wake 标记，MainActivity 据此 setShowWhenLocked/setTurnScreenOn，
 *    锁屏状态下也能显示答题页并自动解锁屏幕；
 * 4) 同时在 SharedPreferences 写 force_challenge 标记，App 重启后仍会强制进入挑战页。
 */
public class KioskService extends AccessibilityService {
    private long lastPull = 0L;
    private String lastForeignPkg = "";
    private long lastForeignAt = 0L;
    private Handler handler;
    private PowerManager.WakeLock wakeLock;
    private BroadcastReceiver screenReceiver;

    private final Runnable patrol = new Runnable() {
        @Override
        public void run() {
            try {
                checkAndPull();
            } catch (Exception e) {
                // 忽略巡检异常，下轮继续
            }
            if (handler != null) handler.postDelayed(this, 3000);
        }
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(patrol, 3000);

        // 亮屏 / 解锁时立即检查一次，避免「时间到了但熄屏状态下干等 3 秒」
        try {
            screenReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    try {
                        checkAndPull();
                    } catch (Exception e) {
                        // 忽略
                    }
                }
            };
            IntentFilter f = new IntentFilter();
            f.addAction(Intent.ACTION_SCREEN_ON);
            f.addAction(Intent.ACTION_USER_PRESENT);
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                // Android 13+ 要求显式声明是否导出（系统广播不导出即可）
                registerReceiver(screenReceiver, f, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(screenReceiver, f);
            }
        } catch (Exception e) {
            screenReceiver = null;
        }
    }

    @Override
    public void onDestroy() {
        if (handler != null) {
            handler.removeCallbacks(patrol);
            handler = null;
        }
        if (screenReceiver != null) {
            try {
                unregisterReceiver(screenReceiver);
            } catch (Exception e) {
                // 忽略
            }
            screenReceiver = null;
        }
        releaseWake();
        super.onDestroy();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        CharSequence pkgCs = event.getPackageName();
        CharSequence clsCs = event.getClassName();
        String pkg = pkgCs == null ? "" : pkgCs.toString();
        String cls = clsCs == null ? "" : clsCs.toString();
        if (pkg.isEmpty()) return;
        // 状态栏/下拉通知、输入法不算离开
        if (pkg.equals("com.android.systemui")) return;
        if (cls.contains("InputMethod") || cls.contains("inputmethod")) return;

        if (pkg.equals(getPackageName())) {
            lastForeignPkg = ""; // 回到本 App
            return;
        }
        lastForeignPkg = pkg;
        lastForeignAt = SystemClock.elapsedRealtime();
        checkAndPull();
    }

    private void checkAndPull() {
        SharedPreferences sp = getSharedPreferences("kiosk", MODE_PRIVATE);
        if (!sp.getBoolean("enabled", false)) return;

        // 解锁期（先学再看自由时间 / 家长临时解锁）内不拉回
        long pauseUntil = Math.max(KioskPlugin.suspendUntil, sp.getLong("unlock_until", 0L));
        if (System.currentTimeMillis() < pauseUntil) return;

        // 前台还是本 App 就不用拉
        if (lastForeignPkg == null || lastForeignPkg.isEmpty()) return;
        // 只处理最近的离开事件，避免误判
        if (SystemClock.elapsedRealtime() - lastForeignAt > 15000) return;

        long now = SystemClock.elapsedRealtime();
        if (now - lastPull < 1500) return;
        lastPull = now;

        pull(sp);
    }

    private void pull(SharedPreferences sp) {
        // 省电 / 熄屏状态下先点亮屏幕，否则 Activity 起来了也看不见
        wakeScreen();

        // 告诉 App：这次是被强制拉回的，必须进挑战页（进程被杀重启也有效）
        try {
            sp.edit().putBoolean("force_challenge", true).apply();
        } catch (Exception e) {
            // 忽略
        }

        Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (i == null) return;
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        i.putExtra("kiosk_wake", true);
        try {
            startActivity(i);
        } catch (Exception e) {
            // 系统限制后台启动时，等下一次巡检（无障碍服务/悬浮窗权限通常已豁免）
        }
    }

    private void wakeScreen() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm == null || pm.isInteractive()) return;
            if (wakeLock != null && wakeLock.isHeld()) return;
            wakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "suansuan:kiosk_wake");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(10000L); // 最多 10 秒，足够亮屏并拉起界面
        } catch (Exception e) {
            // 忽略：无 WAKE_LOCK 权限时不影响正常拉回
        }
    }

    private void releaseWake() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception e) {
            // 忽略
        }
        wakeLock = null;
    }

    @Override
    public void onInterrupt() {
    }
}
