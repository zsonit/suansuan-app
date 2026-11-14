package cn.zsonit.suansuan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * 开机自启：如果家长开了锁定 + 备用监控，重启设备后自动把监控拉起来，
 * 否则孩子关机再开机就能绕过锁定。
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        try {
            String a = intent == null ? "" : String.valueOf(intent.getAction());
            if (!Intent.ACTION_BOOT_COMPLETED.equals(a)
                    && !"android.intent.action.QUICKBOOT_POWERON".equals(a)
                    && !"com.htc.intent.action.QUICKBOOT_POWERON".equals(a)) return;
            if (!KioskPull.locked(ctx)) return;
            boolean watchdog = ctx.getSharedPreferences("kiosk", Context.MODE_PRIVATE)
                    .getBoolean("watchdog_on", false);
            Diag.log(ctx, "boot", "开机自启检查 · 锁定开 · 备用监控=" + watchdog);
            if (watchdog && Diag.usageAccess(ctx)) {
                Intent s = new Intent(ctx, WatchdogService.class);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    ctx.startForegroundService(s);
                } else {
                    ctx.startService(s);
                }
            }
        } catch (Exception e) {
            Diag.log(ctx, "boot", "开机自启失败: " + e.getClass().getSimpleName());
        }
    }
}
