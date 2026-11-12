package cn.zsonit.suansuan;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;

/**
 * 专注锁定服务（家长控制）：
 * 锁定开启时，一旦检测到前台切到了别的应用/桌面/通知栏等，就把算算星球拉回前台。
 * 只有 SharedPreferences("kiosk") 的 enabled 为 true 时才生效；
 * suspendUntil 期间（用户主动去系统设置等）不拉回。
 */
public class KioskService extends AccessibilityService {
    private long lastPull = 0L;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        SharedPreferences sp = getSharedPreferences("kiosk", MODE_PRIVATE);
        if (!sp.getBoolean("enabled", false)) return;
        // 解锁期（先学再看）：静态暂停或持久化解锁期内不拉回
        long pauseUntil = Math.max(KioskPlugin.suspendUntil, sp.getLong("unlock_until", 0L));
        if (System.currentTimeMillis() < pauseUntil) return;

        CharSequence pkgCs = event.getPackageName();
        CharSequence clsCs = event.getClassName();
        String pkg = pkgCs == null ? "" : pkgCs.toString();
        String cls = clsCs == null ? "" : clsCs.toString();
        if (pkg.isEmpty()) return;
        if (pkg.equals(getPackageName())) return;
        // 状态栏/下拉通知、输入法不算离开
        if (pkg.equals("com.android.systemui")) return;
        if (cls.contains("InputMethod") || cls.contains("inputmethod")) return;

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
