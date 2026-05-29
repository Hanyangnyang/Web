package com.hanyangnyang.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String KAKAO_SCHEME = "kakao79b4e1cf4eb03ea19f0eda552d6e219d";
    private String pendingDeepLinkParams = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String ua = getBridge().getWebView().getSettings().getUserAgentString();
        getBridge().getWebView().getSettings().setUserAgentString(ua + " HanyangAndroidApp");
        pendingDeepLinkParams = extractDeepLinkParams(getIntent());
        // FCM 알림 탭으로 콜드 스타트된 경우: Capacitor 이벤트가 리스너 등록 전에 드랍되므로
        // Intent extra의 link 필드를 직접 읽어 Kakao 딥링크와 동일한 경로로 주입
        if (pendingDeepLinkParams == null) {
            String fcmLink = getIntent().getStringExtra("link");
            if (fcmLink != null && !fcmLink.isEmpty()) {
                try {
                    android.net.Uri fcmUri = android.net.Uri.parse(fcmLink);
                    String query = fcmUri.getEncodedQuery();
                    if (query != null && !query.isEmpty()) pendingDeepLinkParams = query;
                } catch (Exception ignored) {}
            }
        }
        // Android 13+ Predictive Back: Capacitor의 기본 동작이 무력화되므로 직접 처리
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getBridge().getWebView().evaluateJavascript(
                    "(function(){ return window.__androidBackPress ? window.__androidBackPress() : false; })()",
                    value -> {
                        if (!"true".equals(value)) {
                            finish();
                        }
                    }
                );
            }
        });

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
                    if (pendingDeepLinkParams != null) {
                        String params = pendingDeepLinkParams;
                        pendingDeepLinkParams = null;
                        injectDeepLink(view, params);
                    }
                }
            }
        );
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String params = extractDeepLinkParams(intent);
        if (params != null) {
            injectDeepLink(getBridge().getWebView(), params);
        }
    }

    // loadUrl 대신 JS 함수 호출로 파라미터만 전달 → 페이지 재로드 없음
    // window.__pendingDeepLinkParams: React 마운트 전 도착 시 useEffect에서 읽음
    // hanyang-deeplink 이벤트: 앱이 이미 실행 중일 때 즉시 수신
    private void injectDeepLink(WebView view, String params) {
        try {
            String quoted = JSONObject.quote(params);
            String js = "var p=" + quoted + ";" +
                        "window.__pendingDeepLinkParams=p;" +
                        "document.dispatchEvent(new CustomEvent('hanyang-deeplink',{detail:p}));";
            view.evaluateJavascript(js, null);
        } catch (Exception ignored) {}
    }

    private String extractDeepLinkParams(Intent intent) {
        if (intent == null) return null;
        Uri data = intent.getData();
        if (data == null) return null;

        String scheme = data.getScheme();

        // Kakao 커스텀 스킴: SDK가 androidExecutionParams를 URL에 직접 풀어서 넣음
        // 예: kakao{key}://kakaolink?date=2026-06-01&cafe=re13&type=조식
        if (KAKAO_SCHEME.equals(scheme)) {
            String query = data.getEncodedQuery();
            if (query != null && !query.isEmpty()) return query;
        }

        // HTTPS App Links: https://www.hanyang.life/?date=...&cafe=...&type=...
        if ("https".equals(scheme)) {
            String host = data.getHost();
            if ("www.hanyang.life".equals(host) || "hanyang.life".equals(host)) {
                String query = data.getEncodedQuery();
                if (query != null && !query.isEmpty()) return query;
            }
        }

        return null;
    }
}
