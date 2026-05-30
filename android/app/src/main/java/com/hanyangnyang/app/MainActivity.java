package com.hanyangnyang.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String KAKAO_SCHEME = "kakao79b4e1cf4eb03ea19f0eda552d6e219d";
    private String pendingDeepLinkParams = null;
    // iOS applicationDidBecomeActive와 onPageFinished 중복 주입 방지
    private boolean deepLinkInjectionStarted = false;

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

                // onPageFinished가 올바른 페이지에서 먼저 실행되면 여기서 주입 시작
                // about:blank 등 중간 페이지에서 실행돼도 injectOrDefer 폴링이 정확한 컨텍스트를 기다림
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    if (!deepLinkInjectionStarted && pendingDeepLinkParams != null) {
                        deepLinkInjectionStarted = true;
                        String params = pendingDeepLinkParams;
                        pendingDeepLinkParams = null;
                        injectOrDefer(view, params);
                    }
                }
            }
        );
    }

    // iOS applicationDidBecomeActive에 대응: onPageFinished가 누락된 경우 보장
    @Override
    protected void onResume() {
        super.onResume();
        if (!deepLinkInjectionStarted && pendingDeepLinkParams != null) {
            deepLinkInjectionStarted = true;
            String params = pendingDeepLinkParams;
            pendingDeepLinkParams = null;
            injectOrDefer(getBridge().getWebView(), params);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String params = extractDeepLinkParams(intent);
        if (params != null) {
            injectDeepLink(getBridge().getWebView(), params);
        }
    }

    // 웜 스타트 전용: React가 이미 실행 중이므로 즉시 주입
    private void injectDeepLink(WebView view, String params) {
        try {
            String quoted = JSONObject.quote(params);
            String js = "var p=" + quoted + ";" +
                        "window.__pendingDeepLinkParams=p;" +
                        "document.dispatchEvent(new CustomEvent('hanyang-deeplink',{detail:p}));";
            view.evaluateJavascript(js, null);
        } catch (Exception ignored) {}
    }

    // 콜드 스타트 전용: window.__reactReady가 true가 될 때까지 100ms 간격으로 재시도
    // onPageFinished나 onResume 시점에 React useEffect가 아직 실행 전일 수 있으므로 대기
    private void injectOrDefer(WebView view, String params) {
        try {
            String quoted = JSONObject.quote(params);
            attemptInject(view, quoted, 0);
        } catch (Exception ignored) {}
    }

    private void attemptInject(WebView view, String quoted, int attempt) {
        if (attempt >= 30) return; // 최대 3초 대기
        String js =
            "(function(){" +
            "if(!window.__reactReady)return false;" +
            "var p=" + quoted + ";" +
            "window.__pendingDeepLinkParams=p;" +
            "document.dispatchEvent(new CustomEvent('hanyang-deeplink',{detail:p}));" +
            "return true;" +
            "})()";
        view.evaluateJavascript(js, result -> {
            if (!"true".equals(result)) {
                new Handler(Looper.getMainLooper()).postDelayed(
                    () -> attemptInject(view, quoted, attempt + 1), 100
                );
            }
        });
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
