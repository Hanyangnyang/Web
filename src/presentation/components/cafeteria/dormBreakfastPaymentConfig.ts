// 기숙사식당 조식(천원의 아침밥) 온라인 결제 안내 — 현장 결제 없이 온라인 식권 구매만 받는다
import { openExternalUrl } from '../../../lib/openExternalUrl.js';

export const DORM_CAFE_ID = 're13';
export const DORM_BREAKFAST_PAYMENT_MESSAGE = '기숙사식당 조식은 온라인 결제만 가능해요';
const DORM_BREAKFAST_PAYMENT_URL = 'https://life.hanyang.ac.kr/theme/pages/payment/ticket-shops.php';

export function openDormBreakfastPayment() {
  void openExternalUrl(DORM_BREAKFAST_PAYMENT_URL);
}
