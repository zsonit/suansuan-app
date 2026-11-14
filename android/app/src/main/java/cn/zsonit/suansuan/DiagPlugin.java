package cn.zsonit.suansuan;

import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;

/**
 * 检修日志插件：开关、写入、查看、导出（系统分享面板：微信/QQ/邮件/存文件）。
 */
@CapacitorPlugin(name = "Diag")
public class DiagPlugin extends Plugin {

    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("on", Diag.enabled(getContext()));
        r.put("size", Diag.file(getContext()).exists() ? Diag.file(getContext()).length() : 0L);
        call.resolve(r);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on"));
        Diag.setEnabled(getContext(), on);
        JSObject r = new JSObject();
        r.put("on", on);
        call.resolve(r);
    }

    @PluginMethod
    public void log(PluginCall call) {
        String tag = call.getString("tag", "app");
        String msg = call.getString("msg", "");
        Diag.log(getContext(), tag, msg);
        call.resolve();
    }

    @PluginMethod
    public void tail(PluginCall call) {
        Integer n = call.getInt("lines", 300);
        JSObject r = new JSObject();
        r.put("text", Diag.tail(getContext(), n == null ? 300 : n.intValue()));
        call.resolve(r);
    }

    @PluginMethod
    public void systemInfo(PluginCall call) {
        JSObject r = new JSObject();
        r.put("text", Diag.envInfo(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void clear(PluginCall call) {
        Diag.clear(getContext());
        Diag.log(getContext(), "diag", "日志已清空");
        call.resolve();
    }

    /** 写出 txt 并调起系统分享；同时返回路径与全文，便于网页版直接复制 */
    @PluginMethod
    public void export(PluginCall call) {
        JSObject r = new JSObject();
        try {
            String head = Diag.envInfo(getContext());
            String body = Diag.read(getContext());
            if (body.isEmpty()) body = "(还没有记录。请先打开检修日志开关，复现问题后再导出)\n";
            String content = "===== 算算星球 检修日志 =====\n" + head + "===== 事件记录 =====\n" + body;

            File dir = new File(getContext().getCacheDir(), "diag");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(dir, Diag.exportName());
            FileOutputStream fos = new FileOutputStream(f, false);
            fos.write(content.getBytes("UTF-8"));
            fos.close();

            r.put("path", f.getAbsolutePath());
            r.put("text", content);

            Uri uri = FileProvider.getUriForFile(
                    getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_SUBJECT, "算算星球 检修日志");
            send.putExtra(Intent.EXTRA_TEXT, "算算星球检修日志（详见附件）");
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "导出检修日志");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getContext().startActivity(chooser);
        } catch (Exception e) {
            Diag.log(getContext(), "diag", "导出失败: " + e.getClass().getSimpleName());
            r.put("path", "");
            r.put("text", Diag.envInfo(getContext()) + "\n\n" + Diag.read(getContext()));
        }
        call.resolve(r);
    }
}
