package cn.zsonit.suansuan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PowerManager;

/**
 * 到点兜底拉起：
 * 家长临时解锁 / 先学再看自由时间结束时，AlarmManager 精确闹钟（setExactAndAllowWhileIdle）
 * 即使在深度待机（Doze）、省电模式、熄屏状态下也会触发，把算算星球拉回前台做挑战。
 * 无障碍服务的 3 秒巡检是第一道防线，这里是第二道，双保险。
 */
public class KioskAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences("kiosk", Context.MODE_PRIVATE);
            if (!sp.getBoolean("enabled", false)) return;

            long pauseUntil = Math.max(KioskPlugin.suspendUntil, sp.getLong("unlock_until", 0L));
            if (System.currentTimeMillis() < pauseUntil - 1000L) return;

            // 先点亮屏幕（熄屏/待机下 Activity 起来也能看见）
            try {
                PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isInteractive()) {
                    PowerManager.WakeLock wl = pm.newWakeLock(
                            PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                            "suansuan:kiosk_alarm");
                    wl.setReferenceCounted(false);
                    wl.acquire(8000L);
                }
            } catch (Exception e) {
                // 忽略
            }

            sp.edit().putBoolean("force_challenge", true).apply();
            Intent i = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
            if (i == null) return;
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            i.putExtra("kiosk_wake", true);
            ctx.startActivity(i);
        } catch (Exception e) {
            // 系统限制后台启动时静默失败，无障碍服务巡检会继续兜底
        }
    }
}
