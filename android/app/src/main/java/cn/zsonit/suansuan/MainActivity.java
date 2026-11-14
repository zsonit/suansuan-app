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
