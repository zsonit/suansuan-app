package cn.zsonit.suansuan;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;

/**
 * 专注锁定插件：锁定开关与配置都存原生 SharedPreferences("kiosk")，
 * 由 KioskService 读取，因此即使 WebView 数据被清也能保持锁定状态。
 */
@CapacitorPlugin(name = "Kiosk")
public class KioskPlugin extends Plugin {
    /** 暂停拉回的时间点（毫秒），用户主动去系统设置时设置 */
    public static volatile long suspendUntil = 0L;

    private SharedPreferences sp() {
        return getContext().getSharedPreferences("kiosk", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled"));
        sp().edit().putBoolean("enabled", enabled).apply();
        Diag.log(getContext(), "kiosk", enabled ? "锁定已开启" : "锁定已关闭");
        if (enabled) {
            // 开锁定就顺手把备用监控拉起来（有「使用情况访问」权限才有效；
            // 服务内部会自查，无权限/锁定关了会自己退出，多拉无副作用）
            startWatchdogIfNeeded();
        } else {
            // 关闭锁定：撤销到点闹钟 + 停掉备用监控，避免误弹
            cancelAlarm();
            stopWatchdogService();
        }
        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", sp().getBoolean("enabled", false));
        call.resolve(ret);
    }

    @PluginMethod
    public void saveConfig(PluginCall call) {
        sp().edit().putString("config", call.getString("json", "")).apply();
        call.resolve();
    }

    @PluginMethod
    public void getConfig(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("json", sp().getString("config", ""));
        call.resolve(ret);
    }

    /** 无障碍服务是否真的在运行：两条路都查（系统列表 + Secure 设置项），任一命中即算开启 */
    private boolean serviceRunning() {
        try {
            AccessibilityManager am =
                    (AccessibilityManager) getContext().getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am != null) {
                List<AccessibilityServiceInfo> list =
                        am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
                if (list != null) {
                    for (AccessibilityServiceInfo info : list) {
                        String id = info.getId();
                        if (id != null && id.contains(getContext().getPackageName())) return true;
                    }
                }
            }
        } catch (Exception e) {
            // 忽略，继续用 Secure 设置判断
        }
        try {
            String enabled = Settings.Secure.getString(
                    getContext().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (enabled != null) {
                String me = getContext().getPackageName();
                for (String s : enabled.split(":")) {
                    if (s.contains(me) && s.contains("KioskService")) return true;
                }
            }
        } catch (Exception e) {
            // 忽略
        }
        return false;
    }

    /** 服务是否被系统登记（queryIntentServices 能查到说明 Manifest 声明没问题） */
    private boolean serviceDeclared() {
        try {
            Intent i = new Intent("android.accessibilityservice.AccessibilityService");
            i.setPackage(getContext().getPackageName());
            List<android.content.pm.ResolveInfo> rs =
                    getContext().getPackageManager().queryIntentServices(i, 0);
            return rs != null && !rs.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    /** 当前 APK 是不是侧载安装（非应用商店）——Android 13+ 侧载会被「受限设置」挡住无障碍 */
    private String installerName() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.content.pm.InstallSourceInfo si =
                        getContext().getPackageManager().getInstallSourceInfo(getContext().getPackageName());
                String p = si == null ? null : si.getInstallingPackageName();
                return p == null ? "" : p;
            }
            String p = getContext().getPackageManager().getInstallerPackageName(getContext().getPackageName());
            return p == null ? "" : p;
        } catch (Exception e) {
            return "";
        }
    }

    @PluginMethod
    public void isServiceOn(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("on", serviceRunning());
        call.resolve(ret);
    }

    /** 无障碍体检：给前端决定显示哪一步引导 */
    @PluginMethod
    public void a11yStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("on", serviceRunning());
        ret.put("declared", serviceDeclared());
        ret.put("sdk", Build.VERSION.SDK_INT);
        ret.put("targetSdk", getContext().getApplicationInfo().targetSdkVersion);
        String ins = installerName();
        ret.put("installer", ins);
        // 安卓 13+ 且非应用商店安装 → 需要先「允许受限制的设置」
        boolean sideload = ins.isEmpty() || ins.equals("com.android.packageinstaller")
                || ins.equals("com.google.android.packageinstaller") || ins.contains("documentsui")
                || ins.contains("filemanager") || ins.contains("browser") || ins.contains("moxiang")
                || ins.contains("vivo.filemanager");
        ret.put("restrictedPossible", Build.VERSION.SDK_INT >= 33 && sideload);
        call.resolve(ret);
    }

    @PluginMethod
    public void suspend(PluginCall call) {
        Integer ms = call.getInt("ms", 60000);
        long until = System.currentTimeMillis() + (ms == null ? 60000L : ms.longValue());
        suspendUntil = until;
        // 长时间解锁（先学再看）持久化到 SharedPreferences，App 进程被杀也生效
        sp().edit().putLong("unlock_until", until).apply();
        // 再设一个精确闹钟兜底：深度待机/省电模式下 Handler 可能被冻结，闹钟仍会到点拉起
        scheduleAlarm(until);
        Diag.log(getContext(), "kiosk", "解锁期 " + (ms == null ? 60000 : ms) + "ms");
        call.resolve();
    }

    private android.app.PendingIntent alarmIntent() {
        Intent i = new Intent(getContext(), KioskAlarmReceiver.class);
        int flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= android.app.PendingIntent.FLAG_IMMUTABLE;
        return android.app.PendingIntent.getBroadcast(getContext(), 1001, i, flags);
    }

    private void scheduleAlarm(long atMillis) {
        try {
            android.app.AlarmManager am =
                    (android.app.AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            android.app.PendingIntent pi = alarmIntent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    // 精确闹钟：Doze 下也会准时触发
                    am.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, atMillis, pi);
                } catch (SecurityException se) {
                    // 没有精确闹钟权限（Android 12+ 需要用户允许）：退化为非精确，仍能在待机中触发
                    am.setAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, atMillis, pi);
                }
            } else {
                am.setExact(android.app.AlarmManager.RTC_WAKEUP, atMillis, pi);
            }
        } catch (Exception e) {
            // 忽略：还有无障碍服务巡检兜底
        }
    }

    private void cancelAlarm() {
        try {
            android.app.AlarmManager am =
                    (android.app.AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.cancel(alarmIntent());
        } catch (Exception e) {
            // 忽略
        }
    }

    @PluginMethod
    public void goHome(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_MAIN);
        i.addCategory(Intent.CATEGORY_HOME);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    /** 家长远程「立即锁定」：清除解锁期 + 撤销到点闹钟 + 把本 App 拉回前台 */
    @PluginMethod
    public void lockNow(PluginCall call) {
        suspendUntil = 0L;
        sp().edit().putLong("unlock_until", 0L).apply();
        cancelAlarm();
        Diag.log(getContext(), "kiosk", "家长远程要求立即锁定");
        try {
            Intent i = getContext().getPackageManager().getLaunchIntentForPackage(getContext().getPackageName());
            if (i != null) {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                getContext().startActivity(i);
            }
        } catch (Exception e) {
            // 拉回失败时还有无障碍服务巡检兜底
        }
        call.resolve();
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        // 先试「本应用的无障碍详情页」（部分 ROM 支持，能少点两层菜单）
        boolean ok = false;
        try {
            Intent d = new Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS");
            d.setData(Uri.parse("package:" + getContext().getPackageName()));
            d.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(d);
            ok = true;
        } catch (Exception e) {
            ok = false;
        }
        if (!ok) {
            try {
                Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } catch (Exception e) {
                openAppDetail();
            }
        }
        // 去系统设置期间（2 分钟）不拉回，方便开启/关闭服务
        suspendUntil = System.currentTimeMillis() + 120000L;
        call.resolve();
    }

    /* ---------------- 备用监控（无障碍开不了时的替代方案） ---------------- */

    private void stopWatchdogService() {
        try {
            getContext().stopService(new Intent(getContext(), WatchdogService.class));
        } catch (Exception e) {
            // 忽略
        }
    }

    /** 有「使用情况访问」权限且服务没在跑时，把备用监控拉起来（自愈） */
    private void startWatchdogIfNeeded() {
        if (WatchdogService.running) return;
        if (!Diag.usageAccess(getContext())) return;
        try {
            Intent s = new Intent(getContext(), WatchdogService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(s);
            } else {
                getContext().startService(s);
            }
            Diag.log(getContext(), "watchdog", "自动恢复备用监控服务");
        } catch (Exception e) {
            Diag.log(getContext(), "watchdog", "自动恢复失败: " + e.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void watchdogStatus(PluginCall call) {
        SharedPreferences sp = sp();
        boolean on = sp.getBoolean("watchdog_on", false);
        // 自愈：配置显示开着、权限也有，但服务死了（覆盖安装后常见）→ 立刻拉起来
        if (on && !WatchdogService.running
                && KioskPull.locked(getContext()) && Diag.usageAccess(getContext())) {
            startWatchdogIfNeeded();
        }
        JSObject ret = new JSObject();
        ret.put("usage", Diag.usageAccess(getContext()));
        ret.put("on", on);
        ret.put("running", WatchdogService.running);
        ret.put("a11y", KioskPull.accessibilityOn(getContext()));
        ret.put("overlay", Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(getContext()));
        call.resolve(ret);
    }

    /** 开启/关闭备用监控（使用情况访问 + 前台服务巡检） */
    @PluginMethod
    public void setWatchdog(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on"));
        sp().edit().putBoolean("watchdog_on", on).apply();
        if (on) {
            try {
                Intent s = new Intent(getContext(), WatchdogService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getContext().startForegroundService(s);
                } else {
                    getContext().startService(s);
                }
            } catch (Exception e) {
                Diag.log(getContext(), "watchdog", "启动失败: " + e.getClass().getSimpleName());
            }
        } else {
            stopWatchdogService();
        }
        Diag.log(getContext(), "watchdog", on ? "家长开启备用监控" : "家长关闭备用监控");
        JSObject ret = new JSObject();
        ret.put("on", on);
        call.resolve(ret);
    }

    /** 去授权「使用情况访问」（备用监控依赖它） */
    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            try {
                Intent i = new Intent(Settings.ACTION_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } catch (Exception e2) {
                openAppDetail();
            }
        }
        suspendUntil = System.currentTimeMillis() + 120000L;
        call.resolve();
    }

    /** 打开本应用详情页：Android 13+ 侧载应用要在这里「⋮ → 允许受限制的设置」后才能开无障碍 */
    @PluginMethod
    public void openAppInfo(PluginCall call) {
        openAppDetail();
        suspendUntil = System.currentTimeMillis() + 120000L;
        call.resolve();
    }

    /* ---------------- 任何模式下都能弹回：系统权限 ---------------- */

    /** 查询当前权限状态：忽略电池优化、悬浮窗（后台弹出）、精确闹钟不查 */
    @PluginMethod
    public void powerStatus(PluginCall call) {
        JSObject ret = new JSObject();
        boolean batteryIgnored = false;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                batteryIgnored = pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
            } else {
                batteryIgnored = true;
            }
        } catch (Exception e) {
            // 忽略
        }
        boolean overlay = true;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                overlay = Settings.canDrawOverlays(getContext());
            }
        } catch (Exception e) {
            // 忽略
        }
        ret.put("batteryIgnored", batteryIgnored);
        ret.put("overlay", overlay);
        ret.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    /** 申请忽略电池优化（省电模式 / Doze 后台限制） */
    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        String pkg = getContext().getPackageName();
        Intent i = null;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + pkg));
            }
        } catch (Exception e) {
            i = null;
        }
        if (i == null) {
            i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        }
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            // 部分 ROM 没有该页面，退到应用详情
            openAppDetail();
        }
        suspendUntil = System.currentTimeMillis() + 120000L;
        call.resolve();
    }

    /** 申请悬浮窗权限（允许后台弹出界面，绕过 Android 10+ 的后台启动限制） */
    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        Intent i;
        try {
            i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
        } catch (Exception e) {
            i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
        }
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            openAppDetail();
        }
        suspendUntil = System.currentTimeMillis() + 120000L;
        call.resolve();
    }

    /** 国产 ROM 的自启动 / 后台运行管理页（能打开就打开，打不开退到应用详情） */
    @PluginMethod
    public void openAutoStartSettings(PluginCall call) {
        String[][] list = new String[][] {
            {"com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"},
            {"com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"},
            {"com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"},
            {"com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"},
            {"com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"},
            {"com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"},
            {"com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity"},
            {"com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity"},
            {"com.meizu.safe", "com.meizu.safe.security.SHOW_APPSEC"},
        };
        boolean opened = false;
        for (String[] c : list) {
            try {
                Intent i = new Intent();
                i.setComponent(new ComponentName(c[0], c[1]));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                opened = true;
                break;
            } catch (Exception e) {
                // 试下一个
            }
        }
        if (!opened) openAppDetail();
        suspendUntil = System.currentTimeMillis() + 120000L;
        call.resolve();
    }

    private void openAppDetail() {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            // 忽略
        }
    }

    /** 取出并清除「强制挑战」标记（无障碍服务拉起时写入，App 重启后仍有效） */
    @PluginMethod
    public void takeForceChallenge(PluginCall call) {
        boolean force = sp().getBoolean("force_challenge", false);
        if (force) sp().edit().putBoolean("force_challenge", false).apply();
        JSObject ret = new JSObject();
        ret.put("force", force);
        call.resolve(ret);
    }
}
