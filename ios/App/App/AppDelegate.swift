import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var pendingDeepLinkParams: String? = nil

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 콜드 스타트: launchOptions에서 Kakao 딥링크 URL 추출
        if let url = launchOptions?[.url] as? URL {
            pendingDeepLinkParams = extractDeepLinkParams(from: url)
        }
        return true
    }

    // Kakao 커스텀 스킴: kakao{key}://kakaolink?date=...&cafe=...&type=...
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if let params = extractDeepLinkParams(from: url) {
            injectOrDefer(params: params)
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    // Universal Links: https://www.hanyang.life/?date=...&cafe=...&type=...
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL,
           let params = extractHTTPSDeepLinkParams(from: url) {
            injectOrDefer(params: params)
        }
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // 앱 실행 또는 활성화 시 홈 화면의 알림 배지(Badge) 숫자 초기화
        UIApplication.shared.applicationIconBadgeNumber = 0

        // 콜드 스타트 대비: 앱이 활성화된 후 pending 파라미터 주입 시도
        if let params = pendingDeepLinkParams {
            pendingDeepLinkParams = nil
            injectOrDefer(params: params)
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    // MARK: - Deeplink helpers

    private func extractDeepLinkParams(from url: URL) -> String? {
        guard url.scheme == "kakao79b4e1cf4eb03ea19f0eda552d6e219d" else { return nil }
        guard let comps = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let query = comps.percentEncodedQuery, !query.isEmpty else { return nil }
        return query
    }

    private func extractHTTPSDeepLinkParams(from url: URL) -> String? {
        guard url.scheme == "https",
              let host = url.host,
              host == "www.hanyang.life" || host == "hanyang.life" else { return nil }
        guard let comps = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let query = comps.percentEncodedQuery, !query.isEmpty else { return nil }
        return query
    }

    // WebView가 아직 로딩 중이면 최대 6초간 재시도 (원격 서버 페이지 로딩 대기)
    private func injectOrDefer(params: String, attempts: Int = 0) {
        guard let webView = getWebView() else {
            if attempts < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    self.injectOrDefer(params: params, attempts: attempts + 1)
                }
            }
            return
        }
        if !webView.isLoading {
            injectDeepLink(params: params, into: webView)
        } else if attempts < 20 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.injectOrDefer(params: params, attempts: attempts + 1)
            }
        }
    }

    private func injectDeepLink(params: String, into webView: WKWebView) {
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(params),
              let quoted = String(data: data, encoding: .utf8) else { return }
        let js = """
        (function(){
          var p=\(quoted);
          window.__pendingDeepLinkParams=p;
          document.dispatchEvent(new CustomEvent('hanyang-deeplink',{detail:p}));
        })();
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    private func getWebView() -> WKWebView? {
        return (window?.rootViewController as? CAPBridgeViewController)?.bridge?.webView
    }
}
