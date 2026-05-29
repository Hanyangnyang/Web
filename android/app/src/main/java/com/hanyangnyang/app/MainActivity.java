package com.hanyangnyang.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private static final String KAKAO_SCHEME = "kakao79b4e1cf4eb03ea19f0eda552d6e219d";
    private static final String BASE_URL = "https://www.hanyang.life/";
    private String pendingDeepLink = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String ua = getBridge().getWebView().getSettings().getUserAgentString();
        getBridge().getWebView().getSettings().setUserAgentString(ua + " HanyangAndroidApp");
        pendingDeepLink = extractDeepLink(getIntent());
        getBridge().getWebView().setWebViewClient(
            new BridgeWebViewClient(getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    String scheme = uri.getScheme();
                    if ("intent".equals(scheme)) {
                        try {
                            Intent intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                            startActivity(intent);
                        } catch (Exception ignored) {}
                        return true;
                    }
                    if ("kakaotalk".equals(scheme) || "kakaolink".equals(scheme)) {
                        try {
                            startActivity(new Intent(Intent.ACTION_VIEW, uri));
                        } catch (ActivityNotFoundException ignored) {}
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    if (pendingDeepLink != null) {
                        String deepLink = pendingDeepLink;
                        pendingDeepLink = null;
                        view.loadUrl(deepLink);
                    }
                }
            }
        );
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String deepLink = extractDeepLink(intent);
        if (deepLink != null) {
            getBridge().getWebView().loadUrl(deepLink);
        }
    }

    private String extractDeepLink(Intent intent) {
        if (intent == null) return null;
        Uri data = intent.getData();
        if (data == null || !KAKAO_SCHEME.equals(data.getScheme())) return null;
        String execParams = data.getQueryParameter("androidExecutionParams");
        if (execParams == null || execParams.isEmpty()) return null;
        return BASE_URL + "?" + execParams;
    }
}
