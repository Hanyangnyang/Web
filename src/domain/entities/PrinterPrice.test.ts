import { describe, expect, it } from 'vitest';
import { composePrice, parsePrice, EMPTY_SERVICE_PRICES, type ServicePrices } from './PrinterPrice.js';

function prices(overrides: Partial<ServicePrices>): ServicePrices {
  return { ...structuredClone(EMPTY_SERVICE_PRICES), ...overrides };
}

describe('composePrice', () => {
  it('고른 서비스를 정해진 순서(복사·인쇄·스캔·팩스)로 합친다', () => {
    const p = prices({ 인쇄: { mono: '100', color: '' }, 복사: { mono: '100', color: '500' } });
    expect(composePrice(['인쇄', '복사'], p)).toBe('복사 흑백 100원, 컬러 500원 / 인쇄 흑백 100원');
  });

  it('한쪽만 입력하면 그쪽만, 무료는 0원', () => {
    expect(composePrice(['스캔'], prices({ 스캔: { mono: '0', color: '' } }))).toBe('스캔 흑백 0원');
    expect(composePrice(['팩스'], prices({ 팩스: { mono: '', color: '300' } }))).toBe('팩스 컬러 300원');
  });

  it('고르기만 하고 비워 둔 서비스, 안 고른 서비스는 뺀다', () => {
    const p = prices({ 복사: { mono: '100', color: '' }, 팩스: { mono: '500', color: '' } });
    expect(composePrice(['복사', '인쇄'], p)).toBe('복사 흑백 100원');
  });

  it('아무것도 없으면 빈 문자열', () => {
    expect(composePrice([], EMPTY_SERVICE_PRICES)).toBe('');
    expect(composePrice(['복사'], EMPTY_SERVICE_PRICES)).toBe('');
  });
});

describe('parsePrice', () => {
  it('composePrice가 만든 문자열을 그대로 되돌린다 (왕복)', () => {
    const p = prices({ 복사: { mono: '100', color: '500' }, 스캔: { mono: '0', color: '' } });
    const text = composePrice(['복사', '스캔'], p);
    expect(parsePrice(text)).toEqual({ selected: ['복사', '스캔'], prices: p, complete: true });
  });

  it("서비스 이름 없는 옛 형식('흑백 50원 · 컬러 300원')은 인쇄로 본다", () => {
    expect(parsePrice('흑백 50원 · 컬러 300원')).toEqual({
      selected: ['인쇄'],
      prices: prices({ 인쇄: { mono: '50', color: '300' } }),
      complete: true,
    });
  });

  it('칸에 못 담는 내용이 섞여 있으면 complete:false (원문을 따로 보여주기 위해)', () => {
    expect(parsePrice('흑백 100원 · 컬러 500원 (A3 가능)').complete).toBe(false);
    expect(parsePrice('A4 흑백 100원, 컬러 500원 / A3 흑백 200원').complete).toBe(false);
    expect(parsePrice('무료').complete).toBe(false);
  });

  it('쉼표가 든 금액(1,000원)도 숫자만 남긴다', () => {
    expect(parsePrice('인쇄 컬러 1,000원').prices.인쇄).toEqual({ mono: '', color: '1000' });
  });

  it('null·빈 문자열은 아무것도 고르지 않은 상태', () => {
    expect(parsePrice(null)).toEqual({ selected: [], prices: EMPTY_SERVICE_PRICES, complete: true });
    expect(parsePrice('')).toEqual({ selected: [], prices: EMPTY_SERVICE_PRICES, complete: true });
  });
});
