package cn.zsonit.suansuan;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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

    @PluginMethod
    public void isServiceOn(PluginCall call) {
        boolean on = false;
        AccessibilityManager am = (AccessibilityManager) getContext().getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (am != null) {
            List<AccessibilityServiceInfo> list =
                    am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
            if (list != null) {
                for (AccessibilityServiceInfo info : list) {
                    String id = info.getId();
                    if (id != null && id.contains(getContext().getPackageName())) {
                        on = true;
                        break;
                    }
                }
            }
        }
        JSObject ret = new JSObject();
        ret.put("on", on);
        call.resolve(ret);
    }

    @PluginMethod
    public void suspend(PluginCall call) {
        Integer ms = call.getInt("ms", 60000);
        suspendUntil = System.currentTimeMillis() + (ms == null ? 60000L : ms.longValue());
        call.resolve();
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        // 去系统设置期间（2 分钟）不拉回，方便开启/关闭服务
        suspendUntil = System.currentTimeMillis() + 120000L;
        call.resolve();
    }
}
