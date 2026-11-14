package cn.zsonit.suansuan;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PowerManager;
import android.provider.Settings;

/**
 * 把算算星球拉回前台的公共逻辑，无障碍巡检（KioskService）、
 * 备用监控（WatchdogService）、到点闹钟（KioskAlarmReceiver）三处共用。
 */
public final class KioskPull {

    private KioskPull() {}

    /** 现在是否处于解锁期（家长临时解锁 / 先学再看自由时间） */
    public static boolean paused(Context c) {
        SharedPreferences sp = c.getSharedPreferences("kiosk", Context.MODE_PRIVATE);
        long pauseUntil = Math.max(KioskPlugin.suspendUntil, sp.getLong("unlock_until", 0L));
        return System.currentTimeMillis() < pauseUntil;
    }

    public static boolean locked(Context c) {
        SharedPreferences sp = c.getSharedPreferences("kiosk", Context.MODE_PRIVATE);
        return sp.getBoolean("enabled", false);
    }

    /** 无障碍服务是否在运行（双路检测） */
    public static boolean accessibilityOn(Context c) {
        try {
            String s = Settings.Secure.getString(
                    c.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (s != null) {
                for (String one : s.split(":")) {
                    if (one.contains(c.getPackageName()) && one.contains("KioskService")) return true;
                }
            }
        } catch (Exception e) {
            // 忽略
        }
        try {
            android.view.accessibility.AccessibilityManager am =
                    (android.view.accessibility.AccessibilityManager) c.getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am != null) {
                java.util.List<android.accessibilityservice.AccessibilityServiceInfo> list =
                        am.getEnabledAccessibilityServiceList(
                                android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
                if (list != null) {
                    for (android.accessibilityservice.AccessibilityServiceInfo info : list) {
                        if (info.getId() != null && info.getId().contains(c.getPackageName())) return true;
                    }
                }
            }
        } catch (Exception e) {
            // 忽略
        }
        return false;
    }

    /** 点亮屏幕（熄屏/省电模式下也能看见被拉回的界面） */
    public static void wakeScreen(Context c) {
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm == null || pm.isInteractive()) return;
            PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "suansuan:pull_wake");
            wl.setReferenceCounted(false);
            wl.acquire(10000L);
        } catch (Exception e) {
            // 忽略
        }
    }

    /** 拉回本 App，并标记这次是被强制拉回的（进挑战页） */
    public static void pull(Context c, String reason) {
        SharedPreferences sp = c.getSharedPreferences("kiosk", Context.MODE_PRIVATE);
        wakeScreen(c);
        try {
            sp.edit().putBoolean("force_challenge", true).apply();
        } catch (Exception e) {
            // 忽略
        }
        Intent i = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (i == null) return;
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        i.putExtra("kiosk_wake", true);
        try {
            c.startActivity(i);
            Diag.log(c, "pull", "拉起成功 · " + reason);
        } catch (Exception e) {
            Diag.log(c, "pull", "拉起失败(" + reason + "): " + e.getClass().getSimpleName());
        }
    }

    /** 当前前台包名（需要「使用情况访问」权限；没权限返回空串） */
    public static String foregroundPkg(Context c) {
        try {
            if (!Diag.usageAccess(c)) return "";
            android.app.usage.UsageStatsManager usm =
                    (android.app.usage.UsageStatsManager) c.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return "";
            long now = System.currentTimeMillis();
            android.app.usage.UsageEvents ev = usm.queryEvents(now - 8000L, now);
            if (ev == null) return "";
            android.app.usage.UsageEvents.Event e = new android.app.usage.UsageEvents.Event();
            String last = "";
            long lastTs = 0L;
            while (ev.hasNextEvent()) {
                ev.getNextEvent(e);
                int t = e.getEventType();
                boolean fg = (t == android.app.usage.UsageEvents.Event.MOVE_TO_FOREGROUND)
                        || (android.os.Build.VERSION.SDK_INT >= 29
                        && t == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED);
                if (fg && e.getTimeStamp() >= lastTs) {
                    lastTs = e.getTimeStamp();
                    last = e.getPackageName();
                }
            }
            return last == null ? "" : last;
        } catch (Exception e) {
            return "";
        }
    }

    public static boolean isSystemUi(String pkg) {
        if (pkg == null) return true;
        return pkg.isEmpty() || pkg.equals("com.android.systemui");
    }
}
