// 프린터기 제보 팝업 — 입구가 둘이라 어떤 제보인지는 여는 쪽이 정해서 넘긴다
//  - 'new' : 프린터 목록 위 플로팅 배너 → 지도에 없는 프린터 제보 (제목: '프린터기 제보하기', 빈 칸에서 시작)
//  - 'edit': 프린터 상세 시트 하단 버튼 → 그 프린터 한 대의 정보 수정 제보
//            (제목: 그 프린터 이름, 지금 값이 칸에 채워진 채 시작, 건물은 바꿀 일이 없어 칸을 숨긴다)
// 항목을 칸별로 받되, 지금 백엔드 제보 API는 자유 텍스트(content) 하나만 받으므로
// 보낼 때 한 줄로 합친다. 프린터 전용 API가 생기면 buildContent만 교체하면 된다
import { useState, type ReactNode } from 'react';
import type { Printer } from '../../../domain/entities/Printer.js';
import { useSubmitFeedbackApi } from '../../hooks/useSubmitFeedbackApi.js';
import { BuildingAutocompleteInput } from './BuildingAutocompleteInput';

export type PrinterFeedbackTarget = { mode: 'new' } | { mode: 'edit'; printer: Printer };

const NOTE_MAX_LENGTH = 200;

interface FormState {
  building: string;
  // 자동완성 후보에서 고른 교내시설 id — 프린터는 백엔드에서 교내시설 하위에 붙으므로 고른 경우 함께 보낸다.
  // 직접 친 이름(목록에 없는 건물)이면 null
  buildingId: string | null;
  detailLocation: string;
  priceMono: string;   // 흑백 1장 가격 (숫자만)
  priceColor: string;  // 컬러 1장 가격 (숫자만)
  // 결제방식은 자유 텍스트 — 카드·계정·현금 등 조합이 프린터마다 달라 선택지로 묶지 않기로 했다
  payment: string;
  note: string;
}

const EMPTY_FORM: FormState = {
  building: '', buildingId: null, detailLocation: '', priceMono: '', priceColor: '', payment: '', note: '',
};

// 엔티티의 가격은 '흑백 50원 · 컬러 300원' 같은 자유 문구라 흑백/컬러 숫자만 뽑아 칸에 채운다
function parsePrice(price: string | null, tag: '흑백' | '컬러'): string {
  const m = price?.match(new RegExp(`${tag}\\s*([\\d,]+)\\s*원`));
  return m ? m[1].replace(/,/g, '') : '';
}

function initialForm(target: PrinterFeedbackTarget): FormState {
  if (target.mode === 'new') return EMPTY_FORM;
  const p = target.printer;
  return {
    ...EMPTY_FORM,
    detailLocation: p.detailLocation ?? '',
    priceMono: parsePrice(p.price, '흑백'),
    priceColor: parsePrice(p.price, '컬러'),
    payment: p.paymentMethod ?? '',
    note: p.notice ?? '',
  };
}

// 항목별 '보여줄 값' — 비교(무엇이 바뀌었나)와 전송 문구 조립에 같이 쓴다. 빈 값은 ''
const FIELDS: { label: string; newOnly?: boolean; show: (f: FormState) => string }[] = [
  { label: '건물', newOnly: true, show: (f) => (f.building.trim() ? `${f.building.trim()}${f.buildingId ? `(${f.buildingId})` : ''}` : '') },
  { label: '세부위치', show: (f) => f.detailLocation.trim() },
  {
    label: '가격',
    show: (f) => [f.priceMono && `흑백 ${f.priceMono}원`, f.priceColor && `컬러 ${f.priceColor}원`].filter(Boolean).join(', '),
  },
  { label: '결제방식', show: (f) => f.payment.trim() },
  { label: '참고사항', show: (f) => f.note.trim() },
];

// 새 제보: 채워진 칸만 '항목: 값'
// 수정 제보: 바뀐 칸만 '항목: 이전 → 새' — 관리자가 무엇을 어떻게 고치면 되는지 바로 보이게
function buildContent(target: PrinterFeedbackTarget, f: FormState, initial: FormState): string {
  if (target.mode === 'new') {
    const parts = FIELDS.map((x) => x.show(f) && `${x.label}: ${x.show(f)}`).filter(Boolean);
    return `[프린터-신규] | ${parts.join(' / ')}`;
  }
  const parts = FIELDS.filter((x) => !x.newOnly && x.show(f) !== x.show(initial))
    .map((x) => `${x.label}: ${x.show(initial) || '없음'} → ${x.show(f) || '(비움)'}`);
  // 이름은 관리자가 바로 알아보게, id는 데이터와 정확히 맞추게 함께 싣는다
  return `[프린터-정보수정] ${target.printer.name}(${target.printer.id}) | ${parts.join(' / ')}`;
}

function hasAnyInput(f: FormState): boolean {
  return FIELDS.some((x) => x.show(f) !== '');
}

function hasChanges(f: FormState, initial: FormState): boolean {
  return FIELDS.some((x) => !x.newOnly && x.show(f) !== x.show(initial));
}

// 입력칸 공통 규격 — 기존 캠퍼스맵 제보 textarea(CampusFeedbackModal)와 같은 배경·테두리·포커스색
const INPUT_CLASS =
  'w-full h-10 bg-surface border border-[#e2e8f0] rounded-xl px-3 text-sm text-text-main placeholder-text-hint outline-none focus:border-primary';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-text-sub mb-1">{label}</span>
      {children}
    </label>
  );
}

// 가격 칸 하나 — 앞에 '흑백/컬러', 뒤에 '원'을 칸 안에 붙여 숫자만 치면 되게 한다
function PriceInput({ tag, value, onChange }: { tag: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1 min-w-0 flex items-center h-10 bg-surface border border-[#e2e8f0] rounded-xl px-3 gap-1.5 focus-within:border-primary">
      <span className="flex-shrink-0 text-[12px] font-bold text-text-hint">{tag}</span>
      <input
        value={value}
        // 숫자 키패드를 띄우고, 붙여넣기 등으로 섞여 들어온 숫자 외 문자는 걸러낸다
        inputMode="numeric"
        maxLength={5}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder="0"
        aria-label={`${tag} 가격`}
        className="flex-1 min-w-0 bg-transparent text-sm text-text-main text-right placeholder-text-hint outline-none"
      />
      <span className="flex-shrink-0 text-[12px] font-bold text-text-hint">원</span>
    </div>
  );
}

export function PrinterFeedbackModal({ target, onClose }: { target: PrinterFeedbackTarget; onClose: () => void }) {
  // 처음 값은 팝업이 열릴 때 한 번만 만들어 고정한다 — 수정 제보의 '무엇이 바뀌었나' 비교 기준.
  // (target은 여는 쪽에서 매 렌더 새 객체로 만들어지므로 useMemo([target])로는 고정되지 않는다)
  const [initial] = useState(() => initialForm(target));
  const [form, setForm] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);
  const submitFeedback = useSubmitFeedbackApi();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const isEdit = target.mode === 'edit';
  // 새 제보는 하나라도 채우면, 수정 제보는 이미 채워진 채 시작하므로 하나라도 바꾸면 보낼 수 있다
  const ready = isEdit ? hasChanges(form, initial) : hasAnyInput(form);
  const canSubmit = ready && !submitFeedback.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitFeedback.mutate(
      { category: 'CAMPUS_MAP', feedbackType: 'INACCURACY', content: buildContent(target, form, initial) },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  const title = target.mode === 'edit' ? target.printer.name : '프린터기 제보하기';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-8" onClick={onClose}>
      {/* 칸이 많아 작은 화면·키보드가 올라온 상태에선 넘칠 수 있으니 카드 안에서 스크롤되게 */}
      <div
        className="w-full max-w-[320px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl px-5 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-2">
            <p className="text-2xl mb-2">📢</p>
            <p className="text-base font-bold text-text-main mb-1">제보 감사합니다!</p>
            <p className="text-xs text-text-sub mb-4">확인 후 지도에 반영할게요.</p>
            <button
              onClick={onClose}
              className="w-full h-10 rounded-full text-sm font-bold text-white bg-primary active:scale-[0.97] transition-transform"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <p className="text-base font-bold text-text-main mb-4 text-center break-keep">{title}</p>

            <div className="space-y-3 mb-4">
              {/* 건물 + 세부위치는 한 줄에 반반 — 둘이 합쳐 '어디'라는 하나의 정보라서.
                  건물은 새 프린터 제보에서만 있다(이미 있는 프린터는 건물이 바뀔 일이 없다) → 수정 제보에선 세부위치가 한 줄을 다 쓴다 */}
              <div className="flex gap-2">
                {!isEdit && (
                  <div className="flex-1 min-w-0">
                    <Field label="건물">
                      <BuildingAutocompleteInput
                        value={form.building}
                        onChange={(text, buildingId) => setForm((prev) => ({ ...prev, building: text, buildingId }))}
                        placeholder="1공"
                        className={INPUT_CLASS}
                        // 칸이 반쪽이라 후보 이름이 잘리지 않게 목록은 두 칸을 합친 폭(자기 폭 x2 + gap-2)으로 편다
                        listClassName="left-0 w-[calc(200%+0.5rem)]"
                      />
                    </Field>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Field label="세부위치">
                    <input value={form.detailLocation} onChange={(e) => set('detailLocation', e.target.value)} maxLength={50} placeholder="3층 한자공" className={INPUT_CLASS} />
                  </Field>
                </div>
              </div>

              {/* 가격 — label로 감싸면 칸 아무 데나 눌러도 첫 입력칸(흑백)에만 포커스가 가서 div로 둔다 */}
              <div>
                <span className="block text-[12px] font-bold text-text-sub mb-1">가격 <span className="font-medium text-text-hint">(1장 기준)</span></span>
                <div className="flex gap-2">
                  <PriceInput tag="흑백" value={form.priceMono} onChange={(v) => set('priceMono', v)} />
                  <PriceInput tag="컬러" value={form.priceColor} onChange={(v) => set('priceColor', v)} />
                </div>
              </div>

              <Field label="결제방식">
                <input value={form.payment} onChange={(e) => set('payment', e.target.value)} maxLength={50} placeholder="카드" className={INPUT_CLASS} />
              </Field>

              <Field label="참고사항">
                {/* 다른 칸과 같은 한 줄 높이 — 길게 쓰면 칸 안에서 가로로 밀린다 */}
                <input
                  value={form.note}
                  maxLength={NOTE_MAX_LENGTH}
                  onChange={(e) => set('note', e.target.value)}
                  placeholder="고장이 자주 나요."
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            {submitFeedback.isError && (
              <p className="text-xs text-red-500 text-center mb-3">제보 접수에 실패했어요. 다시 시도해주세요.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-full text-sm font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex-1 h-10 rounded-full text-sm font-bold active:scale-[0.97] transition-transform ${
                  canSubmit ? 'text-white bg-primary' : 'text-slate-300 bg-slate-100'
                }`}
              >
                {submitFeedback.isPending ? '접수 중...' : '제보하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
