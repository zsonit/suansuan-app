package cn.zsonit.suansuan;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
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

        boolean started = false;
        try {
            c.startActivity(i);
            started = true;
        } catch (Exception e) {
            Diag.log(c, "pull", "直接拉起被系统拦截(" + reason + "): " + e.getClass().getSimpleName());
        }

        // 双保险：安卓 10+ 后台启动 Activity 默认被拦（除非有悬浮窗权限），
        // 再发一条「全屏意图」通知，系统会像来电一样直接把界面弹到孩子面前
        try {
            postFullScreenNotice(c, i);
        } catch (Exception e) {
            Diag.log(c, "pull", "全屏通知失败: " + e.getClass().getSimpleName());
        }

        Diag.log(c, "pull", (started ? "拉起成功" : "改用全屏通知拉回") + " · " + reason);
    }

    private static final int PULL_NOTIF_ID = 2102;
    private static final String PULL_CH_ID = "suansuan_pull";

    private static void postFullScreenNotice(Context c, Intent launch) {
        android.app.NotificationManager nm =
                (android.app.NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            android.app.NotificationChannel ch = new android.app.NotificationChannel(
                    PULL_CH_ID, "回到练习提醒", android.app.NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("锁定期间离开算算星球时的全屏提醒");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        android.app.PendingIntent pi = android.app.PendingIntent.getActivity(
                c, PULL_NOTIF_ID, launch,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
        android.app.Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            b = new android.app.Notification.Builder(c, PULL_CH_ID);
        } else {
            b = new android.app.Notification.Builder(c).setPriority(android.app.Notification.PRIORITY_HIGH);
        }
        b.setContentTitle("时间到了，回来做题吧")
                .setContentText("点按回到算算星球练习界面")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setAutoCancel(true)
                .setContentIntent(pi);
        if (Build.VERSION.SDK_INT >= 29) {
            // 全屏意图：像来电一样直接弹出界面（USE_FULL_SCREEN_INTENT 已声明）
            b.setFullScreenIntent(pi, true);
        }
        nm.notify(PULL_NOTIF_ID, b.build());
    }

    /** 回到本 App 时撤掉「拉回」通知 */
    public static void cancelPullNotice(Context c) {
        try {
            android.app.NotificationManager nm =
                    (android.app.NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(PULL_NOTIF_ID);
        } catch (Exception e) {
            // 忽略
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
