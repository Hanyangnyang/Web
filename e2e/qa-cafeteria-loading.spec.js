// QA 스팟체크: refactor-integration 통합 브랜치 검증용 (일회성, develop에는 반영하지 않음)
// 대상 회귀: 20fc826 "학식 로딩 중 식당 칩이 '전체'만 뜨던 문제 수정"
// + useMenu TanStack Query 마이그레이션(d319583) 이후 칩 선택 필터링이 정상 동작하는지 확인
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fx = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf-8'));

const menu = fx('menu');
const weather = fx('portal-weather');
const library = fx('portal-library');
const banners = fx('banners');

test.beforeEach(async ({ page }) => {
  await page.route('**://*.posthog.com/**', (route) => route.abort());
  await page.route('**/api/banners*', (route) => route.fulfill({ json: banners }));
  await page.route('**/api/portal*', (route) => {
    const type = new URL(route.request().url()).searchParams.get('type');
    route.fulfill({ json: type === 'library' ? library : weather });
  });
});

test.describe('학식 탭 - 로딩 중 식당 칩 회귀 확인', () => {
  test('학식 API 응답이 느려도 로딩 중 "전체" 칩만 뜨지 않고 식당 이름이 같이 보인다', async ({ page }) => {
    // 주의: 단일 '*'는 '/'를 건너뛰지 못해 date=YYYY/MM/DD 같은 쿼리스트링에서 매칭이 깨짐 → '**'로 접미사 통일
    await page.route('**/api/menu**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ json: menu });
    });

    await page.goto('/');

    // 로딩 윈도우(응답 도착 전): 버그가 재발했다면 "전체" 칩만 보이고 아래 두 식당 이름은 안 보임
    await expect(page.getByText('전체', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('학생식당', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('기숙사식당', { exact: true }).first()).toBeVisible();

    // 응답 도착 후: placeholder가 실제 데이터로 정상 대체됨
    await expect(page.getByText('창업보육센터', { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('식당 칩을 선택하면 해당 식당 메뉴만 필터링된다', async ({ page }) => {
    await page.route('**/api/menu**', (route) => route.fulfill({ json: menu }));
    await page.goto('/');

    await expect(page.getByText('기숙사식당', { exact: true }).first()).toBeVisible();
    await page.getByText('기숙사식당', { exact: true }).first().click();

    // 기숙사식당(re13) 전용 메뉴는 DOM에 존재하고, 다른 식당(교직원식당) 전용 메뉴는 사라져야 함
    // (끼니별 아코디언은 기본으로 하나만 펼쳐져 있어 toBeVisible 대신 존재 여부로 필터링 결과를 확인)
    await expect(page.getByText('마늘닭볶음탕')).toHaveCount(1);
    await expect(page.getByText('사천짜장덮밥')).toHaveCount(0);
  });
});
