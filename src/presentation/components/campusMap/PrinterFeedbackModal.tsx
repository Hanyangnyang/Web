// 프린터기 제보 팝업 — 입구가 둘이라 어떤 제보인지는 여는 쪽이 정해서 넘긴다
//  - 'new' : 프린터 목록 위 플로팅 배너 → 지도에 없는 프린터 제보 (POST /campus-map/printer-reports)
//  - 'edit': 프린터 상세 시트 하단 버튼 → 그 프린터의 정보 수정·고장 제보 (POST /campus-map/printers/{id}/reports)
// 폼 값 ↔ 요청 변환 규칙은 printerReportForm.ts에 모아 두고(테스트 있음), 여기는 화면과 실패 처리만 맡는다.
// 제보는 관리자 승인 후 반영되므로 접수돼도 화면의 공개 정보는 바꾸지 않는다.
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { printerDisplayName, type Printer } from '../../../domain/entities/Printer.js';
import { PrinterReportError } from '../../../domain/repositories/IPrinterRepository.js';
import {
  fetchLatestPrinter, useSubmitNewPrinterReport, useSubmitPrinterChangeReport,
} from '../../hooks/campusMap/useSubmitPrinterReport.js';
import { BuildingAutocompleteInput } from './BuildingAutocompleteInput';
import {
  EMPTY_FORM, buildChanges, buildNewPrinter, changedLabels, formFromPrinter, hasRequired, mergeWithLatest,
  type PrinterReportForm, type TriState,
} from './printerReportForm';

export type PrinterFeedbackTarget = { mode: 'new' } | { mode: 'edit'; printer: Printer };

const NOTE_MAX_LENGTH = 200;

// 입력칸 공통 규격 — 기존 캠퍼스맵 제보 textarea(CampusFeedbackModal)와 같은 배경·테두리·포커스색
const INPUT_CLASS =
  'w-full h-10 bg-surface border border-[#e2e8f0] rounded-xl px-3 text-sm text-text-main placeholder-text-hint outline-none focus:border-primary';

// 칸 위 라벨 — 필수 칸은 빨간 *, 선택 칸은 흐린 '(선택)'을 라벨 옆에 붙인다
type FieldMark = 'required' | 'optional';

function FieldLabel({ label, mark }: { label: string; mark: FieldMark }) {
  return (
    <span className="block text-[12px] font-bold text-text-sub mb-1">
      {label}
      {mark === 'required'
        ? <span className="text-red-500 ml-0.5" aria-label="필수">*</span>
        : <span className="font-medium text-text-hint ml-1">(선택)</span>}
    </span>
  );
}

function Field({ label, mark, children }: { label: string; mark: FieldMark; children: ReactNode }) {
  return (
    <label className="block">
      <FieldLabel label={label} mark={mark} />
      {children}
    </label>
  );
}

// 가격 칸 하나 — 앞에 '흑백/컬러', 뒤에 '원'을 칸 안에 붙여 숫자만 치면 되게 한다
function PriceInput({ tag, value, onChange }: { tag: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1 min-w-0 flex items-center h-10 bg-surface border border-[#e2e8f0] rounded-xl px-3 gap-1.5 focus-within:border-primary">
      <span className="flex-shrink-0 text-[12px] font-bold text-text-main">{tag}</span>
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

// 모름 / 예 / 아니오 드롭다운 — 결제방식과 한 줄에 반반으로 두기 위해 폭을 적게 차지하는 드롭다운으로 둔다.
// 네이티브 select라 모바일에선 OS 기본 선택창이 뜬다. 기본값 '모름'은 회색 글씨로 보여 '미확인'과 '확인함'을 구분한다
function TriStateSelect({
  label, value, onChange, yesLabel, noLabel,
}: {
  label: string;
  value: TriState;
  onChange: (v: TriState) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <Field label={label} mark="optional">
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as TriState)}
          className={`${INPUT_CLASS} appearance-none pr-9 ${value === 'unknown' ? 'text-text-hint' : ''}`}
        >
          <option value="unknown">모름</option>
          <option value="yes">{yesLabel}</option>
          <option value="no">{noLabel}</option>
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-hint" />
      </div>
    </Field>
  );
}

// 제출 실패·충돌 안내 — warn(409: 최신 정보를 확인하고 다시 제출), error(그 밖의 실패·삭제된 프린터)
type Notice = { tone: 'warn' | 'error'; text: string } | null;

export function PrinterFeedbackModal({ target, onClose }: { target: PrinterFeedbackTarget; onClose: () => void }) {
  const isEdit = target.mode === 'edit';

  // 수정 제보의 '비교 기준' — 어떤 서버 정보(printer·version)를 보고 고치는 중인지.
  // 처음엔 연 순간의 정보, 409가 나면 최신 정보로 바뀐다. (target은 매 렌더 새 객체라 state로 고정한다)
  const [base, setBase] = useState<{ printer: Printer | null; form: PrinterReportForm }>(() =>
    target.mode === 'edit' ? { printer: target.printer, form: formFromPrinter(target.printer) } : { printer: null, form: EMPTY_FORM }
  );
  const [form, setForm] = useState<PrinterReportForm>(base.form);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [blocked, setBlocked] = useState(false);       // 삭제된 프린터 — 더 보낼 수 없다
  const [resolving, setResolving] = useState(false);   // 409 뒤 최신 정보 다시 불러오는 중

  const newReport = useSubmitNewPrinterReport();
  const changeReport = useSubmitPrinterChangeReport();
  const pending = newReport.isPending || changeReport.isPending || resolving;

  const set = <K extends keyof PrinterReportForm>(key: K, value: PrinterReportForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // 수정 제보는 '바뀐 항목'이 하나라도 있어야 보낼 수 있다 (없으면 서버가 400)
  const changes = isEdit && base.printer ? buildChanges(form, base.form, base.printer) : null;
  const ready = hasRequired(form, isEdit) && (!isEdit || Object.keys(changes ?? {}).length > 0);
  const canSubmit = ready && !pending && !blocked;

  // 409: 버전만 바꿔 자동 재전송하지 않는다 — 최신 정보를 받아 폼에 합쳐 보여주고, 사용자가 확인 후 다시 제출한다
  const resolveConflict = async (printerId: string) => {
    setResolving(true);
    try {
      const latest = await fetchLatestPrinter(printerId);
      if (!latest) {
        setBlocked(true);
        setNotice({ tone: 'error', text: '이 프린터는 삭제됐어요. 목록을 새로 불러올게요.' });
        return;
      }
      const newBase = formFromPrinter(latest);
      const labels = changedLabels(base.form, newBase);
      setForm((prev) => mergeWithLatest(prev, base.form, newBase));
      setBase({ printer: latest, form: newBase });
      setNotice({
        tone: 'warn',
        text: `그사이 프린터 정보가 바뀌었어요${labels.length ? ` (${labels.join(', ')})` : ''}${
          latest.removed ? ' · 철거된 프린터로 등록돼 있어요' : ''
        }. 최신 정보를 확인하고 다시 제출해주세요.`,
      });
    } catch {
      setNotice({ tone: 'error', text: '최신 프린터 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.' });
    } finally {
      setResolving(false);
    }
  };

  const handleError = (error: unknown) => {
    if (!(error instanceof PrinterReportError)) {
      setNotice({ tone: 'error', text: '제보 접수에 실패했어요. 다시 시도해주세요.' });
      return;
    }
    if (error.kind === 'conflict' && base.printer) {
      void resolveConflict(base.printer.id);
      return;
    }
    if (error.kind === 'notFound' && isEdit) {
      setBlocked(true);
      setNotice({ tone: 'error', text: '이 프린터는 삭제됐어요. 목록을 새로 불러올게요.' });
      return;
    }
    // invalid(400)·notFound(신규: 건물 없음)·server·network — 서버 메시지 또는 종류별 기본 문구
    setNotice({ tone: 'error', text: error.message });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setNotice(null);
    if (isEdit && base.printer && changes) {
      changeReport.mutate(
        { printerId: base.printer.id, expectedVersion: base.printer.version, changes },
        { onSuccess: () => setSubmitted(true), onError: handleError }
      );
    } else {
      newReport.mutate({ printer: buildNewPrinter(form) }, { onSuccess: () => setSubmitted(true), onError: handleError });
    }
  };

  const title = isEdit && base.printer ? printerDisplayName(base.printer) : '프린터기 제보하기';
  // 건물 이름만 치고 목록에서 고르지 않은 상태 — 신규 제보 API는 건물 id가 필수라 고르게 안내한다
  const buildingNotPicked = !isEdit && form.building.trim() !== '' && form.buildingId === null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-8" onClick={onClose}>
      {/* 칸이 많아 작은 화면·키보드가 올라온 상태에선 넘칠 수 있으니 카드 안에서 스크롤되게 */}
      <div
        className="w-full max-w-[320px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl px-5 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          // API 문서 안내 문구 그대로 — 관리자 승인 전이라 지도 정보는 아직 바뀌지 않는다
          <div className="text-center py-2">
            <p className="text-2xl mb-2">📢</p>
            <p className="text-base font-bold text-text-main mb-1">제보가 접수되었습니다.</p>
            <p className="text-xs text-text-sub mb-4">관리자 확인 후 반영됩니다.</p>
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
              <div>
                <div className="flex gap-2">
                  {!isEdit && (
                    <div className="flex-1 min-w-0">
                      <Field label="건물" mark="required">
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
                    <Field label="세부위치" mark="required">
                      <input value={form.detailLocation} onChange={(e) => set('detailLocation', e.target.value)} maxLength={50} placeholder="3층 한자공" className={INPUT_CLASS} />
                    </Field>
                  </div>
                </div>
                {buildingNotPicked && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">목록에서 건물을 골라주세요</p>
                )}
              </div>

              {/* 가격 — label로 감싸면 칸 아무 데나 눌러도 첫 입력칸(흑백)에만 포커스가 가서 div로 둔다 */}
              <div>
                <FieldLabel label="가격" mark="optional" />
                <div className="flex gap-2">
                  <PriceInput tag="흑백" value={form.priceMono} onChange={(v) => set('priceMono', v)} />
                  <PriceInput tag="컬러" value={form.priceColor} onChange={(v) => set('priceColor', v)} />
                </div>
              </div>

              {/* 결제방식 + 고장 여부는 한 줄에 반반. 고장 여부는 이미 있는 프린터의 수정 제보에서만 —
                  새로 알려주는 프린터는 '어디에 있다'가 핵심이라 상태까지 묻지 않고, 그땐 결제방식이 한 줄을 다 쓴다 */}
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <Field label="결제방식" mark="optional">
                    <input value={form.payment} onChange={(e) => set('payment', e.target.value)} maxLength={50} placeholder="카드" className={INPUT_CLASS} />
                  </Field>
                </div>
                {isEdit && (
                  <div className="flex-1 min-w-0">
                    <TriStateSelect label="고장 여부" value={form.broken} onChange={(v) => set('broken', v)} yesLabel="고장" noLabel="정상" />
                  </div>
                )}
              </div>

              <Field label="참고사항" mark="optional">
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

            {notice && (
              <p className={`text-xs text-center mb-3 break-keep ${notice.tone === 'warn' ? 'text-amber-600' : 'text-red-500'}`}>
                {notice.text}
              </p>
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
                {resolving ? '최신 정보 확인 중...' : pending ? '접수 중...' : '제보하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
