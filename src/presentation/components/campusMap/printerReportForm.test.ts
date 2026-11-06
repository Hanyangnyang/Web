import { describe, expect, it } from 'vitest';
import {
  EMPTY_FORM, buildChanges, buildNewPrinter, changedLabels, formFromPrinter, hasRequired, mergeWithLatest,
  type PrinterReportForm,
} from './printerReportForm.js';
import type { Printer } from '../../../domain/entities/Printer.js';

function printer(overrides: Partial<Printer> = {}): Printer {
  return {
    id: 'p-1', buildingId: 'building-101', buildingName: '학술정보관', campus: 'ANSAN',
    detailLocation: '1층 로비 편의점 옆', name: '로비 프린터',
    price: '흑백 100원, 컬러 500원', paymentMethod: '카드, 현금', notes: '주말 이용 가능',
    broken: false, removed: false, updatedAt: '2026-11-06T06:00:00Z', version: 3,
    ...overrides,
  };
}

const form = (o: Partial<PrinterReportForm>): PrinterReportForm => ({ ...EMPTY_FORM, ...o });

describe('신규 제보', () => {
  it('건물은 목록에서 골라야(buildingId) 필수 조건을 만족한다', () => {
    expect(hasRequired(form({ building: '1공', detailLocation: '3층' }), false)).toBe(false);
    expect(hasRequired(form({ building: '제1공학관', buildingId: 'building-301', detailLocation: '3층' }), false)).toBe(true);
    expect(hasRequired(form({ buildingId: 'building-301', detailLocation: '  ' }), false)).toBe(false);
  });

  it('채운 칸만 보내고 빈 칸은 키를 뺀다 (broken·removed는 아예 안 보냄)', () => {
    const body = buildNewPrinter(form({ buildingId: 'building-301', detailLocation: ' 3층 한자공 ', priceMono: '50', payment: '카드' }));
    expect(body).toEqual({ buildingId: 'building-301', detailLocation: '3층 한자공', price: '흑백 50원', paymentMethod: '카드', notes: undefined });
    expect(JSON.parse(JSON.stringify(body))).toEqual({ buildingId: 'building-301', detailLocation: '3층 한자공', price: '흑백 50원', paymentMethod: '카드' });
  });
});

describe('수정 제보 — buildChanges', () => {
  const p = printer();
  const base = formFromPrinter(p);

  it('아무것도 안 바꾸면 빈 객체 (제보 버튼이 꺼진다)', () => {
    expect(buildChanges(base, base, p)).toEqual({});
  });

  it('바꾼 항목만 넣는다', () => {
    expect(buildChanges({ ...base, priceMono: '200' }, base, p)).toEqual({ price: '흑백 200원, 컬러 500원' });
  });

  it('지운 칸은 null (기존 정보 제거 요청)', () => {
    expect(buildChanges({ ...base, payment: '', note: '' }, base, p)).toEqual({ paymentMethod: null, notes: null });
    expect(buildChanges({ ...base, priceMono: '', priceColor: '' }, base, p)).toEqual({ price: null });
  });

  it("고장 등록 없는 프린터를 '고장'으로 → broken: true", () => {
    expect(buildChanges({ ...base, broken: 'yes' }, base, p)).toEqual({ broken: true });
  });

  it("고장 등록 없는 프린터는 '정상'으로 시작하고, 그대로 두거나 '모름'으로 바꾸면 broken을 보내지 않는다", () => {
    expect(base.broken).toBe('no');
    expect(buildChanges({ ...base, broken: 'no' }, base, p)).toEqual({});
    expect(buildChanges({ ...base, broken: 'unknown' }, base, p)).toEqual({});
  });

  it("고장 등록된 프린터를 '정상'으로 → broken: false (고장 해제 요청), '모름'으로 되돌리면 안 보냄", () => {
    const bp = printer({ broken: true });
    const bBase = formFromPrinter(bp);
    expect(bBase.broken).toBe('yes');
    expect(buildChanges({ ...bBase, broken: 'no' }, bBase, bp)).toEqual({ broken: false });
    expect(buildChanges({ ...bBase, broken: 'unknown' }, bBase, bp)).toEqual({});
  });

  it('세부위치는 null을 보낼 수 없어, 비우면 changes에 넣지 않는다 (필수 검사가 막음)', () => {
    expect(buildChanges({ ...base, detailLocation: '' }, base, p)).toEqual({});
    expect(hasRequired({ ...base, detailLocation: '' }, true)).toBe(false);
  });
});

describe('409 뒤 최신 정보 합치기', () => {
  it('손대지 않은 칸은 최신 값으로, 고친 칸은 그대로', () => {
    const oldBase = formFromPrinter(printer());
    const newBase = formFromPrinter(printer({ paymentMethod: '카드', notes: '평일만' }));
    const edited = { ...oldBase, priceMono: '200' }; // 사용자는 가격만 고쳤다

    const merged = mergeWithLatest(edited, oldBase, newBase);

    expect(merged).toMatchObject({ priceMono: '200', payment: '카드', note: '평일만' });
    expect(changedLabels(oldBase, newBase)).toEqual(['결제방식', '참고사항']);
  });
});
