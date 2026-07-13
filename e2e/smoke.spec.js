// 스모크 테스트: 배포 전 "이게 깨지면 내보내면 안 되는" 핵심 화면 5개의 생존 확인.
// 데이터 API는 fixtures/ 응답으로 고정 — 실제 날씨·학식에 따라 테스트가 흔들리지 않게 한다.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fx = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf-8'));

const menu = fx('menu');
const weather = fx('portal-weather');
const library = fx('portal-library');
const banners = fx('banners');

test.beforeEach(async ({ page }) => {
  // 테스트 실행이 실제 사용자 분석 데이터로 집계되지 않도록 차단.
  // 주의: 도메인 기준으로만 차단할 것 — URL 전체에 /posthog/를 걸면
  // Vite dev 서버가 서빙하는 posthog-js 모듈 파일까지 차단돼 앱 부팅이 통째로 죽는다.
  await page.route('**://*.posthog.com/**', (route) => route.abort());

  await page.route('**/api/menu*', (route) => route.fulfill({ json: menu }));
  await page.route('**/api/banners*', (route) => route.fulfill({ json: banners }));
  await page.route('**/api/portal*', (route) => {
    const type = new URL(route.request().url()).searchParams.get('type');
    route.fulfill({ json: type === 'library' ? library : weather });
  });

  await page.goto('/');
});

test('앱이 로드되고 하단 탭 네비게이션이 표시된다', async ({ page }) => {
  await expect(page.getByText('학식', { exact: true })).toBeVisible();
  await expect(page.getByText('셔틀·지하철', { exact: true })).toBeVisible();
  await expect(page.getByText('소식', { exact: true })).toBeVisible();
});

test('학식 탭에서 식당별 메뉴가 렌더된다', async ({ page }) => {
  // 기본 탭이 학식이므로 별도 이동 없이 fixture의 식당 이름이 보여야 한다
  await expect(page.getByText('학생식당').first()).toBeVisible();
  await expect(page.getByText('기숙사식당').first()).toBeVisible();
});

test('셔틀 탭에서 시간표가 표시된다', async ({ page }) => {
  await page.getByText('셔틀·지하철', { exact: true }).click();
  await expect(page.getByText('시간표', { exact: true }).first()).toBeVisible();
});

test('소식 탭에서 날씨 박스가 표시된다', async ({ page }) => {
  await page.getByText('소식', { exact: true }).click();
  await expect(page.getByText('안산시 상록구 사동')).toBeVisible();
  // 미세먼지 정보바 — fixture 기준 미세 '보통', 초미세 '좋음'
  await expect(page.getByText('초미세', { exact: true })).toBeVisible();
  await expect(page.getByText('좋음', { exact: true }).first()).toBeVisible();
});

test('날씨 알림 설정 모달이 열린다', async ({ page }) => {
  await page.getByText('소식', { exact: true }).click();
  await page.getByText('날씨 알림 받기').click();
  await expect(page.getByText('날씨 알림설정')).toBeVisible();
});
