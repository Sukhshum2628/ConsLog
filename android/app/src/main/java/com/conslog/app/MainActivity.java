package com.conslog.app;

import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // Clear all WebView caches to break the stale PWA loop
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().clearCache(true);
            android.webkit.WebStorage.getInstance().deleteAllData();
        }
    }
}
