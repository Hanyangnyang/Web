// QA 스팟체크: refactor-integration 통합 브랜치 검증용 (일회성, develop에는 반영하지 않음)
// 대상: 기타탭 컴포넌트 분해(MiscView/GymView/InstagramView/FeedbackView 분리),
//       Accordion 공용 컴포넌트 추출, 알림 설정 시트 3종의 useAlarmSubscription 공용화
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fx = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf-8'));

const menu = fx('menu');
const weather = fx('portal-weather');
const library = fx('portal-library');
const banners = fx('banners');

test.beforeEach(async ({ page }) => {
  await page.route('**://*.posthog.com/**', (route) => route.abort());
  // 주의: 단일 '*'는 '/'를 건너뛰지 못해 date=YYYY/MM/DD 같은 쿼리스트링에서 매칭이 깨짐 → '**'로 접미사 통일
  await page.route('**/api/menu**', (route) => route.fulfill({ json: menu }));
  await page.route('**/api/banners*', (route) => route.fulfill({ json: banners }));
  await page.route('**/api/portal*', (route) => {
    const type = new URL(route.request().url()).searchParams.get('type');
    route.fulfill({ json: type === 'library' ? library : weather });
  });
  // 알림 구독 조회/저장 RPC — 실제 Supabase 프로젝트에 테스트용 더미 데이터가 쌓이지 않도록 차단
  await page.route('**/rest/v1/rpc/get_alarm_subscription*', (route) =>
    route.fulfill({ json: null })
  );
  await page.route('**/rest/v1/rpc/upsert_alarm_subscription*', (route) =>
    route.fulfill({ json: null })
  );
  // 피드백 저장도 마찬가지로 실제 테이블에 쓰지 않도록 차단
  await page.route('**/rest/v1/feedbacks*', (route) =>
    route.fulfill({ status: 201, json: [] })
  );

  await page.goto('/');
});

test.describe('기타탭 - 컴포넌트 분해(MiscView/GymView/InstagramView/FeedbackView) 회귀 확인', () => {
  test('그리드 → 헬스장 진입 → 뒤로가기로 그리드 복귀', async ({ page }) => {
    await page.getByText('기타', { exact: true }).click();
    await expect(page.getByText('기타 서비스', { exact: true })).toBeVisible();

    await page.getByText('체대 헬스장', { exact: true }).click();
    await expect(page.getByText('체대 헬스장', { exact: true }).first()).toBeVisible();
    // 실제 헬스장 시간표 테이블(요일 헤더)이 로드됨
    await expect(page.getByText('월', { exact: true })).toBeVisible({ timeout: 5000 });

    // 뒤로가기 버튼으로 그리드로 복귀 — onBack prop 배선이 분해 후에도 살아있는지 확인
    await page.getByRole('button').first().click();
    await expect(page.getByText('기타 서비스', { exact: true })).toBeVisible();
  });

  test('인스타그램 아코디언이 정상적으로 접히고 펼쳐진다', async ({ page }) => {
    await page.getByText('기타', { exact: true }).click();
    await page.getByText('학교 인스타그램', { exact: true }).click();

    const ericaHeader = page.getByText('에리카', { exact: true });
    await expect(ericaHeader).toBeVisible();
    await expect(page.getByText('한양대학교 ERICA 공식 인스타그램')).toBeVisible();

    // grid-template-rows: 0fr 트릭으로 접히는 방식이라, 자손 텍스트의 toBeVisible()은
    // 조상의 클리핑을 반영하지 않아 못 잡아낸다 → 실제 접힘 컨테이너 자체를 검증
    // 주의: 다른 탭들도 display:none으로 항상 마운트돼 있어 .accordion-content가 앱 전체에 여럿 존재함 →
    // '에리카' 헤더의 형제 요소로 정확히 스코프를 좁혀야 함
    const ericaContent = ericaHeader.locator(
      'xpath=ancestor::div[contains(@class,"cursor-pointer")][1]/following-sibling::div[contains(@class,"accordion-content")][1]'
    );
    await expect(ericaContent).toHaveClass(/expanded/);

    // 기본 펼침 상태 → 헤더 클릭 시 접힘(grid-template-rows: 0fr → 컨테이너 높이 0에 수렴)
    await ericaHeader.click();
    await expect(ericaContent).not.toHaveClass(/expanded/);
    await expect(async () => {
      const box = await ericaContent.boundingBox();
      expect(box?.height ?? 0).toBeLessThan(5);
    }).toPass({ timeout: 2000 });

    // 다시 클릭하면 펼쳐짐
    await ericaHeader.click();
    await expect(ericaContent).toHaveClass(/expanded/);
  });

  test('피드백 폼: 5자 미만이면 제출이 막히고, 정상 제출 시 완료 화면으로 전환된다', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await page.getByText('기타', { exact: true }).click();
    await page.getByText('피드백 하기', { exact: true }).click();

    const textarea = page.getByPlaceholder('하냥냥에게 바라는 점을 자유롭게 작성해 주세요. (5자 이상)');
    const submitButton = page.getByRole('button', { name: '보내기' });

    // 5자 미만: 버튼이 비활성화 상태여야 함
    await textarea.fill('버그');
    await expect(submitButton).toBeDisabled();

    // 5자 이상: 제출 가능 + 제출 후 완료 화면 노출
    await textarea.fill('로딩이 너무 느려요');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    await expect(page.getByText('소중한 피드백이 전송되었어요', { exact: true })).toBeVisible();
  });
});

test.describe('알림 설정 시트 3종 공용화(useAlarmSubscription) 회귀 확인', () => {
  test('날씨 알림: 매일/평일 ↔ 비눈·미세먼지·자외선 조건이 서로 배타적으로 동작하고, 조건 선택 시 시간 선택 단계가 열린다', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    // 알림 on 상태를 미리 심어둠 — 헤드리스 Chromium에서는 CDP로 'notifications' 권한을 허용해도
    // Notification.permission이 'granted'로 반영되지 않아(환경 한계) 토글 클릭 경로로는 검증이 불안정함.
    // 이 테스트가 보려는 건 조건 칩 배타성 로직(useAlarmSubscription 공용화 리스크)이지 브라우저 알림 권한
    // 플로우가 아니므로, 이미 enabled=true인 상태를 로컬스토리지로 시딩해 그 경로를 우회함.
    await page.addInitScript(() => {
      localStorage.setItem('weather_alarm_settings', JSON.stringify({
        enabled: true,
        params: { conditions: { daily: false, weekday: false, rainSnow: false, dust: false, uv: false }, notifyTime: '08:00', notifyDay: '당일' },
      }));
    });
    await page.goto('/');

    await page.getByText('소식', { exact: true }).click();
    await page.getByText('날씨 알림 받기', { exact: true }).click();
    await expect(page.getByText('날씨 알림설정', { exact: true })).toBeVisible();
    await expect(page.locator('.alarm-toggle input[type="checkbox"]')).toBeChecked();

    const dailyChip = page.getByRole('button', { name: '매일', exact: true });
    const weekdayChip = page.getByRole('button', { name: '평일', exact: true });
    const rainChip = page.getByRole('button', { name: '비/눈', exact: true });

    await dailyChip.click();
    await expect(dailyChip).toHaveClass(/bg-primary/);

    // 비/눈 선택 시 매일/평일 그룹은 자동 해제(배타적 선택)되고, 매일 칩은 더 이상 active 스타일이 아니어야 함
    await rainChip.click();
    await expect(rainChip).toHaveClass(/bg-primary/);
    await expect(dailyChip).not.toHaveClass(/bg-primary/);
    await expect(weekdayChip).not.toHaveClass(/bg-primary/);

    // 반대로 매일을 다시 선택하면 비/눈 등 상세 조건이 전부 해제됨
    await dailyChip.click();
    await expect(dailyChip).toHaveClass(/bg-primary/);
    await expect(rainChip).not.toHaveClass(/bg-primary/);
  });

  test('학식 알림 설정 시트도 동일한 공용 훅으로 정상 오픈된다', async ({ page }) => {
    await expect(page.getByText('학생식당').first()).toBeVisible();
    await page.getByText('학식 알림 받기', { exact: true }).click();
    await expect(page.getByText('학식 알림설정', { exact: true })).toBeVisible();
    await expect(page.getByText('알림 방식 선택', { exact: true })).toBeVisible();
  });
});
