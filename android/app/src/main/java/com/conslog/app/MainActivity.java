package com.conslog.app;

import android.os.Bundle;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String PREFS_NAME = "AppPrefs";
    private static final String KEY_LAST_VERSION_CODE = "last_version_code";

    @Override
    public void onStart() {
        super.onStart();
        checkAppUpdateAndClearCache();
    }

    private void checkAppUpdateAndClearCache() {
        try {
            Context context = getApplicationContext();
            PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            // Use long version code for newer APIs, fallback to int for older
            long currentVersionCode = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P 
                ? packageInfo.getLongVersionCode() 
                : packageInfo.versionCode;

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long lastVersionCode = prefs.getLong(KEY_LAST_VERSION_CODE, -1);

            if (currentVersionCode != lastVersionCode) {
                Log.i("ConsLogger", "App Version changed from " + lastVersionCode + " to " + currentVersionCode + ". Clearing WebView cache.");
                
                if (this.bridge != null && this.bridge.getWebView() != null) {
                    this.bridge.getWebView().clearCache(true);
                }
                
                SharedPreferences.Editor editor = prefs.edit();
                editor.putLong(KEY_LAST_VERSION_CODE, currentVersionCode);
                editor.apply();
            }
        } catch (Exception e) {
            Log.e("ConsLogger", "Error checking for app update", e);
        }
    }
}
