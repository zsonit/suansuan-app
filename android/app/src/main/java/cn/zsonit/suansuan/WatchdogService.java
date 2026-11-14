package cn.zsonit.suansuan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

/**
 * 备用监控（不依赖无障碍服务）：
 * 无障碍被系统限制、开不了的时候，用「使用情况访问」权限每 2 秒查一次当前前台应用，
 * 发现孩子离开算算星球就立刻拉回来。
 * 只在家长手动开启、且锁定打开时工作；无障碍正常运行时会自动让位（不重复拉）。
 */
public class WatchdogService extends Service {
    private static final String CH_ID = "suansuan_watchdog";
    private static final int CH_NOTIFY_ID = 1101;
    private Handler handler;
    private long lastPull = 0L;
    private String lastLoggedPkg = "";
    private boolean warnedNoPerm = false;

    private final Runnable loop = new Runnable() {
        @Override
        public void run() {
            try {
                tick();
            } catch (Exception e) {
                Diag.log(getApplicationContext(), "watchdog", "巡检异常: " + e.getClass().getSimpleName());
            }
            if (handler != null) handler.postDelayed(this, 2000);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        startAsForeground();
        handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(loop, 2000);
        Diag.log(this, "watchdog", "备用监控已启动");
    }

    private void startAsForeground() {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
                NotificationChannel ch = new NotificationChannel(
                        CH_ID, "专注锁定 · 备用监控", NotificationManager.IMPORTANCE_MIN);
                ch.setShowBadge(false);
                ch.setSound(null, null);
                nm.createNotificationChannel(ch);
            }
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                b = new Notification.Builder(this, CH_ID);
            } else {
                b = new Notification.Builder(this);
            }
            b.setContentTitle("算算星球正在守护中")
                    .setContentText("锁定期间会把你带回练习界面")
                    .setSmallIcon(android.R.drawable.ic_lock_lock)
                    .setOngoing(true);
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(CH_NOTIFY_ID, b.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(CH_NOTIFY_ID, b.build());
            }
        } catch (Exception e) {
            Diag.log(this, "watchdog", "前台通知失败: " + e.getClass().getSimpleName());
        }
    }

    private void tick() {
        Context c = getApplicationContext();
        if (!KioskPull.locked(c)) {
            Diag.log(c, "watchdog", "锁定已关闭，备用监控自动停止");
            stopSelf();
            return;
        }
        if (KioskPull.paused(c)) return; // 解锁期内不管

        // 无障碍正常时让它干活，这里只保活，不重复拉
        if (KioskPull.accessibilityOn(c)) {
            lastLoggedPkg = "";
            return;
        }

        if (!Diag.usageAccess(c)) {
            if (!warnedNoPerm) {
                warnedNoPerm = true;
                Diag.log(c, "watchdog", "没有「使用情况访问」权限，备用监控暂时无效");
            }
            return;
        }

        String fg = KioskPull.foregroundPkg(c);
        if (fg.isEmpty()) return;
        if (fg.equals(c.getPackageName())) {
            lastLoggedPkg = "";
            return;
        }
        if (KioskPull.isSystemUi(fg)) return;
        // 桌面、其他应用、游戏都算「离开」，一律拉回

        long now = System.currentTimeMillis();
        if (now - lastPull < 3000L) return;
        lastPull = now;
        if (!fg.equals(lastLoggedPkg)) {
            lastLoggedPkg = fg;
            Diag.log(c, "watchdog", "检测到前台切到 " + fg);
        }
        KioskPull.pull(c, "备用监控: " + fg);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (handler != null) {
            handler.removeCallbacks(loop);
            handler = null;
        }
        Diag.log(this, "watchdog", "备用监控已停止");
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
