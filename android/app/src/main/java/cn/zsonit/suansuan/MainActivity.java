package cn.zsonit.suansuan;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(KioskPlugin.class);
        registerPlugin(DiagPlugin.class);
        applyKioskWake(getIntent());
        onAppStart();
    }

    /**
     * 每次打开 App 做三件事：
     * 1) 记启动日志（锁定/监控/无障碍/权限快照，出问题导出日志一看便知）；
     * 2) 备用监控自愈——覆盖安装后配置还在、服务却死了，这里把它拉起来；
     * 3) 撤掉「拉回」全屏通知（人已经回来了）。
     */
    private void onAppStart() {
        try {
            KioskPull.cancelPullNotice(this);
            android.content.SharedPreferences sp =
                    getSharedPreferences("kiosk", MODE_PRIVATE);
            boolean enabled = sp.getBoolean("enabled", false);
            boolean wd = sp.getBoolean("watchdog_on", false);
            Diag.log(this, "app", "应用启动 v"
                    + (getPackageManager().getPackageInfo(getPackageName(), 0).versionName)
                    + " · 锁定=" + enabled
                    + " 备用监控开关=" + wd
                    + " 监控运行中=" + WatchdogService.running
                    + " 无障碍=" + KioskPull.accessibilityOn(this)
                    + " 使用情况访问=" + Diag.usageAccess(this)
                    + " 悬浮窗=" + (Build.VERSION.SDK_INT < 23 || android.provider.Settings.canDrawOverlays(this)));
            if (enabled && wd && !WatchdogService.running && Diag.usageAccess(this)) {
                Intent s = new Intent(this, WatchdogService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(s);
                } else {
                    startService(s);
                }
                Diag.log(this, "watchdog", "打开 App 时恢复备用监控");
            }
            // 安卓 13+ 通知运行时权限：不授权的话「拉回」全屏通知发不出来
            if (Build.VERSION.SDK_INT >= 33) {
                if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                        != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{ android.Manifest.permission.POST_NOTIFICATIONS }, 2102);
                }
            }
        } catch (Exception e) {
            // 忽略：自检失败不影响主流程
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        applyKioskWake(intent);
    }

    /**
     * 专注锁定把 App 拉回前台时带 kiosk_wake 标记：
     * 锁屏状态下直接显示答题页并点亮屏幕，不用孩子手动解锁。
     */
    private void applyKioskWake(Intent intent) {
        if (intent == null || !intent.getBooleanExtra("kiosk_wake", false)) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true);
                setTurnScreenOn(true);
            } else {
                getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && km != null && km.isKeyguardLocked()) {
                // 不需要密码锁的设备直接划走锁屏；需要密码的由系统按 showWhenLocked 叠在上层
                km.requestDismissKeyguard(this, null);
            }
        } catch (Exception e) {
            // 忽略：个别 ROM 不支持这些 API，不影响正常显示
        }
    }
}
