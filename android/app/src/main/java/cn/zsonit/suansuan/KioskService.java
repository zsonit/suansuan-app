package cn.zsonit.suansuan;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;

/**
 * 专注锁定服务（家长控制）：
 * 锁定开启时，只要前台不是算算星球（任何 APP、游戏、视频、桌面都算），就把算算星球拉回前台。
 * 除了窗口切换时立即拉回，还每 3 秒巡检一次：
 * 孩子解锁时间在看别的 APP 时到点（没有切窗口事件），也能及时拉回来做续时挑战。
 * 只有 SharedPreferences("kiosk") 的 enabled 为 true 时才生效；
 * suspendUntil / unlock_until 期间（家长临时解锁、先学再看自由时间）不拉回。
 */
public class KioskService extends AccessibilityService {
    private long lastPull = 0L;
    private String lastForeignPkg = "";
    private long lastForeignAt = 0L;
    private Handler handler;
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
    }

    @Override
    public void onDestroy() {
        if (handler != null) {
            handler.removeCallbacks(patrol);
            handler = null;
        }
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

        Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (i == null) return;
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(i);
    }

    @Override
    public void onInterrupt() {
    }
}
