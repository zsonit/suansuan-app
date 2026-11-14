package cn.zsonit.suansuan;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Environment;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * 检修日志：家长排查问题用。
 * 开关把事件追加写入应用私有目录的 diag.log，可一键导出（分享到微信/存文件）。
 * 日志默认开启（排查问题最怕「出事那段没记上」），开关只用于临时关掉；单文件上限 512KB，超出自动截断保留后半段。
 */
public final class Diag {
    private static final String PREF = "diag";
    private static final String KEY_ON = "on";
    private static final String FILE_NAME = "diag.log";
    private static final long MAX_BYTES = 512 * 1024L;
    private static final Object LOCK = new Object();

    private Diag() {}

    public static boolean enabled(Context c) {
        if (c == null) return false;
        try {
            return c.getSharedPreferences(PREF, Context.MODE_PRIVATE).getBoolean(KEY_ON, true);
        } catch (Exception e) {
            return false;
        }
    }

    public static void setEnabled(Context c, boolean on) {
        if (c == null) return;
        try {
            c.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().putBoolean(KEY_ON, on).apply();
            if (on) log(c, "diag", "检修日志已开启 v" + appVersion(c) + " sdk" + Build.VERSION.SDK_INT);
        } catch (Exception e) {
            // 忽略
        }
    }

    public static File file(Context c) {
        return new File(c.getFilesDir(), FILE_NAME);
    }

    public static void log(Context c, String tag, String msg) {
        if (c == null || !enabled(c)) return;
        String t = new SimpleDateFormat("MM-dd HH:mm:ss", Locale.CHINA).format(new Date());
        String line = t + " [" + tag + "] " + (msg == null ? "" : msg) + "\n";
        synchronized (LOCK) {
            FileOutputStream fos = null;
            try {
                File f = file(c);
                if (f.exists() && f.length() > MAX_BYTES) {
                    // 截断：保留后半段，避免无限增长
                    String keep = tail(c, 800);
                    FileOutputStream w = new FileOutputStream(f, false);
                    w.write(keep.getBytes("UTF-8"));
                    w.close();
                }
                fos = new FileOutputStream(f, true);
                fos.write(line.getBytes("UTF-8"));
            } catch (Exception e) {
                // 忽略：日志失败不能影响主流程
            } finally {
                try {
                    if (fos != null) fos.close();
                } catch (Exception e) {
                    // 忽略
                }
            }
        }
    }

    public static String read(Context c) {
        synchronized (LOCK) {
            try {
                File f = file(c);
                if (!f.exists()) return "";
                BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"));
                StringBuilder sb = new StringBuilder();
                String l;
                while ((l = r.readLine()) != null) sb.append(l).append('\n');
                r.close();
                return sb.toString();
            } catch (Exception e) {
                return "";
            }
        }
    }

    /** 取最后 n 行 */
    public static String tail(Context c, int n) {
        String all = read(c);
        if (all.isEmpty()) return "";
        String[] lines = all.split("\n");
        int start = Math.max(0, lines.length - n);
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < lines.length; i++) sb.append(lines[i]).append('\n');
        return sb.toString();
    }

    public static void clear(Context c) {
        synchronized (LOCK) {
            try {
                File f = file(c);
                if (f.exists()) {
                    FileOutputStream w = new FileOutputStream(f, false);
                    w.write("".getBytes("UTF-8"));
                    w.close();
                }
            } catch (Exception e) {
                // 忽略
            }
        }
    }

    private static String appVersion(Context c) {
        try {
            android.content.pm.PackageInfo pi = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            return pi.versionName + "(" + pi.versionCode + ")";
        } catch (Exception e) {
            return "?";
        }
    }

    /** 导出用文件名：算算星球-检修日志-20261114-1602.txt */
    public static String exportName() {
        return "算算星球-检修日志-" + new SimpleDateFormat("yyyyMMdd-HHmm", Locale.CHINA).format(new Date()) + ".txt";
    }

    /** 环境快照：排查无障碍/锁定问题时最关键的信息 */
    public static String envInfo(Context c) {
        StringBuilder sb = new StringBuilder();
        sb.append("App: ").append(appVersion(c)).append('\n');
        sb.append("设备: ").append(Build.MANUFACTURER).append(' ').append(Build.MODEL).append('\n');
        sb.append("系统: Android ").append(Build.VERSION.RELEASE).append(" (API ").append(Build.VERSION.SDK_INT).append(")\n");
        try {
            sb.append("ROM: ").append(Build.DISPLAY).append('\n');
        } catch (Exception e) {
            // 忽略
        }
        try {
            sb.append("targetSdk: ").append(c.getApplicationInfo().targetSdkVersion).append('\n');
        } catch (Exception e) {
            // 忽略
        }
        try {
            String ins = "";
            if (Build.VERSION.SDK_INT >= 30) {
                android.content.pm.InstallSourceInfo si = c.getPackageManager().getInstallSourceInfo(c.getPackageName());
                ins = si.getInstallingPackageName() == null ? "(无/侧载)" : si.getInstallingPackageName();
            } else {
                ins = c.getPackageManager().getInstallerPackageName(c.getPackageName());
                if (ins == null) ins = "(无/侧载)";
            }
            sb.append("安装来源: ").append(ins).append('\n');
        } catch (Exception e) {
            // 忽略
        }
        sb.append("无障碍服务: ").append(accessibilityText(c)).append('\n');
        sb.append("使用情况访问: ").append(usageAccess(c) ? "已授权" : "未授权").append('\n');
        sb.append("忽略电池优化: ").append(ignoringBattery(c) ? "是" : "否").append('\n');
        sb.append("悬浮窗: ").append(overlay(c) ? "是" : "否").append('\n');
        try {
            sb.append("外部存储: ").append(Environment.getExternalStorageState()).append('\n');
        } catch (Exception e) {
            // 忽略
        }
        return sb.toString();
    }

    private static String accessibilityText(Context c) {
        try {
            String s = android.provider.Settings.Secure.getString(
                    c.getContentResolver(), android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            boolean on = s != null && s.contains(c.getPackageName());
            return on ? "已开启" : "未开启";
        } catch (Exception e) {
            return "未知";
        }
    }

    public static boolean usageAccess(Context c) {
        try {
            android.app.AppOpsManager am = (android.app.AppOpsManager) c.getSystemService(Context.APP_OPS_SERVICE);
            int mode;
            if (Build.VERSION.SDK_INT >= 29) {
                mode = am.unsafeCheckOpNoThrow("android:get_usage_stats", android.os.Process.myUid(), c.getPackageName());
            } else {
                mode = am.checkOpNoThrow("android:get_usage_stats", android.os.Process.myUid(), c.getPackageName());
            }
            return mode == android.app.AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean ignoringBattery(Context c) {
        try {
            android.os.PowerManager pm = (android.os.PowerManager) c.getSystemService(Context.POWER_SERVICE);
            return pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName());
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean overlay(Context c) {
        try {
            return android.provider.Settings.canDrawOverlays(c);
        } catch (Exception e) {
            return false;
        }
    }
}
