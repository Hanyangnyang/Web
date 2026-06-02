package com.hanyangnyang.app;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageButton;
import android.widget.RelativeLayout;

import androidx.appcompat.app.AppCompatActivity;

public class WebViewActivity extends AppCompatActivity {
    public static final String EXTRA_URL = "url";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        String url = getIntent().getStringExtra(EXTRA_URL);

        RelativeLayout layout = new RelativeLayout(this);
        layout.setBackgroundColor(0xFFFFFFFF);

        // 닫기 버튼
        ImageButton closeBtn = new ImageButton(this);
        closeBtn.setId(View.generateViewId());
        closeBtn.setImageResource(android.R.drawable.ic_menu_close_clear_cancel);
        closeBtn.setBackgroundColor(0x00000000);
        RelativeLayout.LayoutParams btnParams = new RelativeLayout.LayoutParams(120, 120);
        btnParams.addRule(RelativeLayout.ALIGN_PARENT_END);
        btnParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        btnParams.setMargins(0, 48, 24, 0);
        closeBtn.setLayoutParams(btnParams);
        closeBtn.setOnClickListener(v -> finish());

        // WebView
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                // http/https는 WebView 내에서 렌더링 — 시스템 인텐트(App Links) 차단
                return !"http".equals(scheme) && !"https".equals(scheme);
            }
        });

        RelativeLayout.LayoutParams wvParams = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        wvParams.addRule(RelativeLayout.BELOW, closeBtn.getId());
        webView.setLayoutParams(wvParams);

        layout.addView(webView);
        layout.addView(closeBtn);
        setContentView(layout);

        if (url != null) {
            webView.loadUrl(url);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
