// QA 스팟체크: refactor-integration 통합 브랜치 검증용 (일회성, develop에는 반영하지 않음)
// 대상 회귀: 느린 네트워크에서 스플래시 마스코트(hanyang_splash.png)가 non-interlaced PNG라
// 위에서부터 잘린 채로 그려지던 문제 — 로드 완료 전까지 shimmer로 대신 보여주도록 수정
import { test, expect } from '@playwright/test';

test.describe('스플래시 화면 - 마스코트 이미지 shimmer 로딩', () => {
  test('이미지 로딩이 느리면 shimmer가 먼저 보이고, 로드 완료 후 이미지로 자연스럽게 교체된다', async ({ page }) => {
    // 실제 네트워크를 느리게 만드는 대신, 이 요청만 인위적으로 지연시켜 로딩 윈도우를 확보
    await page.route('**/hanyang_splash.png', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });

    // 기본 waitUntil('load')은 리소스 로딩까지 기다려서 스플래시가 이미 끝난 뒤에야 반환될 수 있음 —
    // DOM 커밋 시점에 바로 반환받아 스플래시가 떠있는 동안 곧바로 확인한다
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const shimmer = page.getByTestId('splash-shimmer');
    const img = page.getByAltText('하냥냥', { exact: true });

    // 로딩 윈도우: shimmer가 보이고, 이미지는 아직 투명해서 잘린 모습이 노출되지 않는다
    await expect(shimmer).toBeVisible({ timeout: 1000 });
    await expect(img).toHaveCSS('opacity', '0');

    // 로드 완료 후: shimmer는 사라지고 완성된 이미지가 나타난다
    await expect(shimmer).toBeHidden({ timeout: 2000 });
    await expect(img).toHaveCSS('opacity', '1');
  });
});
