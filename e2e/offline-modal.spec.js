// 오프라인 안내 모달 회귀 확인:
// 1) 정상 사용 중 네트워크가 끊기면 모달이 뜨고, 복구되면 자동으로 사라진다
// 2) 애초에 오프라인 상태로 앱을 켜면 스플래시가 끝나지(홈으로 넘어가지) 않고 모달이 그 위에 뜬다
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fx = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf-8'));

const menu = fx('menu');
const weather = fx('portal-weather');
const library = fx('portal-library');
const banners = fx('banners');

test.beforeEach(async ({ page }) => {
  await page.route('**://*.posthog.com/**', (route) => route.abort());
  await page.route('**/api/menu**', (route) => route.fulfill({ json: menu }));
  await page.route('**/api/banners*', (route) => route.fulfill({ json: banners }));
  await page.route('**/api/portal*', (route) => {
    const type = new URL(route.request().url()).searchParams.get('type');
    route.fulfill({ json: type === 'library' ? library : weather });
  });
});

test.describe('오프라인 안내 모달', () => {
  test('네트워크가 끊기면 모달이 뜨고, 복구되면 자동으로 사라진다', async ({ page }) => {
    await page.goto('/');
    // 오프라인 모달은 splashDone 여부와 무관하게 뜨므로, 우선 홈 화면이 정상적으로 뜬 뒤(온라인 상태) 테스트 시작
    await expect(page.getByText('학생식당', { exact: true }).first()).toBeVisible();

    await page.context().setOffline(true);
    await expect(page.getByText('네트워크가 연결되지 않았습니다', { exact: false })).toBeVisible();

    await page.context().setOffline(false);
    await expect(page.getByText('네트워크가 연결되지 않았습니다', { exact: false })).toBeHidden();
  });

  test('오프라인 상태로 앱을 켜면 스플래시가 끝나지 않고 모달이 그 위에 뜬다', async ({ page }) => {
    // 주의: 여기서 context.setOffline(true) 후 goto()를 하면 개발 서버(localhost) 자체에 접속하지 못해
    // ERR_INTERNET_DISCONNECTED로 실패한다 (Service Worker 캐시가 없는 dev 서버에서는 "완전한 오프라인 최초 진입"을
    // 재현할 방법이 없음 — 실제로도 SW 캐시 없이는 브라우저가 아무것도 못 받아오는 게 정상 동작).
    // 그래서 실제 네트워크는 살려두고, JS가 로드된 시점에 navigator.onLine만 false로 위장해
    // "앱은 열렸지만 오프라인으로 판정되는" 상황을 재현한다.
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'onLine', { get: () => false, configurable: true });
    });

    await page.goto('/');

    // 오프라인 모달이 스플래시 위에 노출됨
    await expect(page.getByText('네트워크가 연결되지 않았습니다', { exact: false })).toBeVisible();

    // 스플래시 최소 노출 시간(1.5s)+페이드(450ms)보다 충분히 지나도,
    // 오프라인 상태면 SplashScreen이 unmount되지 않고(=splashDone이 false로 유지) 태그라인이 계속 DOM에 남아있어야 함
    // (주의: 홈 화면 텍스트는 스플래시/모달에 가려져도 DOM에는 항상 존재하므로 "안 보인다"는 이 방식으론 검증 불가 — 대신 스플래시 잔존 여부로 검증)
    await page.waitForTimeout(2500);
    await expect(page.getByText('에리카 생활을 위한 꿀정보 모음')).toBeVisible();

    // 온라인 복귀 시뮬레이션: onLine을 true로 되돌리고 online 이벤트를 직접 발생시킴
    await page.evaluate(() => {
      Object.defineProperty(window.navigator, 'onLine', { get: () => true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    await expect(page.getByText('네트워크가 연결되지 않았습니다', { exact: false })).toBeHidden();
    await expect(page.getByText('에리카 생활을 위한 꿀정보 모음')).toHaveCount(0);
    await expect(page.getByText('학생식당', { exact: true }).first()).toBeVisible();
  });
});
