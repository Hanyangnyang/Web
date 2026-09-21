import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, MousePointer2, RotateCcw, Sparkles, X } from 'lucide-react';

interface Suggestion {
  text: string;
  reason: string;
}

interface SuggestionResponse {
  suggestions: Suggestion[];
  assessment: string;
  improvementNeeded: boolean;
  toneConsistency: {
    status: 'consistent' | 'mixed' | 'inconsistent' | 'insufficient';
    summary: string;
  };
}

interface SelectedCopy {
  element: HTMLElement;
  originalText: string;
  currentText: string;
  nearbyText: string;
  peerTexts: string[];
}

type CopySource =
  | { kind: 'text'; element: HTMLElement; node: Text }
  | { kind: 'placeholder'; element: HTMLInputElement | HTMLTextAreaElement };

function directTextNode(element: HTMLElement): Text | null {
  const nodes = Array.from(element.childNodes);
  return nodes.find((node): node is Text => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())) ?? null;
}

function selectableTarget(target: EventTarget | null): CopySource | null {
  if (!(target instanceof HTMLElement) || target.closest('[data-ux-writing-tool]')) return null;

  if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && target.placeholder.trim()) {
    return { kind: 'placeholder', element: target };
  }

  let element: HTMLElement | null = target;
  while (element && element !== document.body) {
    const node = directTextNode(element);
    if (node) return { kind: 'text', element, node };
    element = element.parentElement;
  }
  return null;
}

function readCopy(source: CopySource): string {
  return source.kind === 'text'
    ? source.node.textContent?.trim() ?? ''
    : source.element.placeholder.trim();
}

function writeCopy(source: CopySource, text: string) {
  if (source.kind === 'text') source.node.textContent = text;
  else source.element.placeholder = text;
}

function sourceIsConnected(source: CopySource): boolean {
  return source.kind === 'text' ? source.node.isConnected : source.element.isConnected;
}

function rectFor(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

function peerTextsFor(element: HTMLElement): string[] {
  const parent = element.parentElement;
  if (!parent) return [];

  return Array.from(parent.children)
    .filter((sibling): sibling is HTMLElement => sibling instanceof HTMLElement && sibling !== element)
    .filter((sibling) => !sibling.closest('[data-ux-writing-tool]'))
    .map((sibling) => {
      const visibleText = sibling.innerText.replace(/\s+/g, ' ').trim();
      if (visibleText) return visibleText;
      const field = sibling.matches('input, textarea')
        ? sibling as HTMLInputElement | HTMLTextAreaElement
        : sibling.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      return field?.placeholder.trim() ?? '';
    })
    .filter(Boolean)
    .slice(0, 8)
    .map((text) => text.slice(0, 180));
}

const CONSISTENCY_LABEL = {
  consistent: { label: '톤 일치', className: 'bg-emerald-50 text-emerald-700' },
  mixed: { label: '일부 혼용', className: 'bg-amber-50 text-amber-700' },
  inconsistent: { label: '톤 불일치', className: 'bg-red-50 text-red-700' },
  insufficient: { label: '비교 부족', className: 'bg-slate-100 text-slate-600' },
} as const;

export default function UXWritingOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<SelectedCopy | null>(null);
  const [briefMode, setBriefMode] = useState(false);
  const [brief, setBrief] = useState('');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<SuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const selectedRef = useRef<SelectedCopy | null>(null);
  const selectedSourceRef = useRef<CopySource | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: MouseEvent) => {
      setHovered(selectableTarget(event.target)?.element ?? null);
    };
    const blockInteraction = (event: PointerEvent) => {
      if (!selectableTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };
    const onClick = (event: MouseEvent) => {
      const target = selectableTarget(event.target);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const text = readCopy(target);
      const parentText = target.element.parentElement?.innerText?.trim() ?? target.element.innerText.trim();
      const next: SelectedCopy = {
        element: target.element,
        originalText: text,
        currentText: text,
        nearbyText: parentText.slice(0, 500),
        peerTexts: peerTextsFor(target.element),
      };
      selectedSourceRef.current = target;
      setSelected(next);
      setDraft(text);
      setResult(null);
      setError(null);
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('pointerdown', blockInteraction, true);
    document.addEventListener('pointerup', blockInteraction, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('pointerdown', blockInteraction, true);
      document.removeEventListener('pointerup', blockInteraction, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [enabled]);

  useEffect(() => () => {
    const copy = selectedRef.current;
    const source = selectedSourceRef.current;
    if (copy && source && sourceIsConnected(source)) writeCopy(source, copy.originalText);
  }, []);

  const preview = useCallback((text: string) => {
    const source = selectedSourceRef.current;
    if (!source || !sourceIsConnected(source)) return;
    writeCopy(source, text);
    setDraft(text);
    setSelected((copy) => copy ? { ...copy, currentText: text } : copy);
  }, []);

  const restore = useCallback(() => {
    if (!selected) return;
    preview(selected.originalText);
  }, [preview, selected]);

  const closeSelection = useCallback(() => {
    restore();
    setSelected(null);
    setResult(null);
    setError(null);
  }, [restore]);

  const selectAnother = useCallback(() => {
    closeSelection();
    setHovered(null);
    setEnabled(true);
  }, [closeSelection]);

  const openBriefMode = useCallback(() => {
    setBriefMode(true);
    setEnabled(false);
    setResult(null);
    setError(null);
  }, []);

  const requestSuggestions = useCallback(async () => {
    if ((!selected && !brief.trim()) || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ux-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentText: selected ? (draft.trim() || selected.originalText) : '',
          originalText: selected?.originalText || '',
          nearbyText: selected?.nearbyText || '',
          peerTexts: selected?.peerTexts || [],
          context: brief.trim(),
          tagName: selected?.element.tagName.toLowerCase() || '',
          ariaLabel: selected?.element.getAttribute('aria-label') || '',
          route: `${window.location.pathname}${window.location.search}`,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || '추천을 받아오지 못했어요.');
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '추천을 받아오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [brief, draft, loading, selected]);

  const handleSuggestion = useCallback(async (text: string) => {
    if (selected) {
      preview(text);
      return;
    }
    await navigator.clipboard?.writeText(text);
    setCopiedText(text);
    window.setTimeout(() => setCopiedText(null), 1600);
  }, [preview, selected]);

  const activeElement = selected?.element ?? hovered;
  const activeRect = activeElement ? rectFor(activeElement) : null;

  return (
    <div data-ux-writing-tool className="fixed inset-0 z-[20000] pointer-events-none font-sans">
      {enabled && activeRect && (
        <div
          className={`fixed rounded border-2 ${selected ? 'border-violet-500 bg-violet-500/10' : 'border-sky-500 bg-sky-500/10'} pointer-events-none`}
          style={{ left: activeRect.left - 3, top: activeRect.top - 3, width: activeRect.width + 6, height: activeRect.height + 6 }}
        />
      )}

      {!selected && !briefMode && (
        <div className="pointer-events-auto fixed right-4 bottom-20 flex flex-col items-end gap-2">
          <button type="button" onClick={openBriefMode} className="flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2.5 text-xs font-extrabold text-violet-700 shadow-xl"><Sparkles size={15} /> 아이디어부터 시작</button>
        <button
          type="button"
          onClick={() => {
            setEnabled((value) => !value);
            setHovered(null);
          }}
          className={`pointer-events-auto fixed right-4 bottom-20 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold text-white shadow-xl transition ${enabled ? 'bg-violet-600' : 'bg-slate-900'}`}
        >
          <MousePointer2 size={17} />
          {enabled ? '검토할 문구를 선택하세요' : '문구 검토'}
        </button>
        </div>
      )}

      {(selected || briefMode) && (
        <aside className="pointer-events-auto fixed right-3 top-3 bottom-3 w-[min(390px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-black"><Sparkles size={18} className="text-violet-600" /> UX Writing Buddy</div>
              <p className="mt-1 text-xs font-medium text-slate-500">{selected ? '선택한 문구를 화면에서 바로 비교해 보세요.' : '상황만 설명해도 문구 아이디어를 제안해 드려요.'}</p>
            </div>
            <div className="flex items-center gap-1">
              {selected && <button type="button" onClick={selectAnother} className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-extrabold text-violet-700 hover:bg-violet-100">
                <MousePointer2 size={13} /> 다른 문구 선택
              </button>}
              <button
                type="button"
                onClick={() => {
                  if (selected) closeSelection();
                  setBriefMode(false);
                  setBrief('');
                  setEnabled(false);
                }}
                aria-label="문구 검토 종료"
                className="rounded-full p-1.5 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {selected ? <label className="text-xs font-extrabold text-slate-600" htmlFor="ux-writing-draft">현재 문구</label> : <label className="text-xs font-extrabold text-slate-600" htmlFor="ux-writing-brief">상황 설명</label>}
          <textarea
            id={selected ? 'ux-writing-draft' : 'ux-writing-brief'}
            value={selected ? draft : brief}
            onChange={(event) => selected ? setDraft(event.target.value) : setBrief(event.target.value)}
            placeholder={selected ? undefined : '예: 중앙동아리 검색 결과가 없을 때 보여줄 문구가 필요해요'}
            rows={selected ? 3 : 5}
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm font-semibold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
          {selected && <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => preview(draft)} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">직접 쓴 문구 미리보기</button>
            <button type="button" onClick={restore} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"><RotateCcw size={13} /> 복원</button>
          </div>}

          <button
            type="button"
            onClick={requestSuggestions}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}
            {loading ? '문구를 고민하는 중…' : selected ? 'AI 추천받기' : '아이디어 추천받기'}
          </button>

          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</p>}

          {result && (
            <div className="mt-5 space-y-3">
              <div className={`rounded-lg p-3 ${result.improvementNeeded ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
                <div className="text-xs font-extrabold">
                  {result.improvementNeeded ? '개선하면 좋아요' : '개선 필요 없음'}
                </div>
                {result.assessment && <p className="mt-1.5 text-xs font-medium leading-relaxed">{result.assessment}</p>}
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-700">같은 레벨 문구와 비교</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${CONSISTENCY_LABEL[result.toneConsistency.status].className}`}>
                    {CONSISTENCY_LABEL[result.toneConsistency.status].label}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">{result.toneConsistency.summary}</p>
              </div>
              {result.suggestions.map((suggestion, index) => (
                <button
                  type="button"
                  key={`${suggestion.text}-${index}`}
                  onClick={() => handleSuggestion(suggestion.text)}
                  className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-400 hover:bg-violet-50"
                >
                  <span className="flex items-start gap-2 text-sm font-extrabold"><Check size={16} className="mt-0.5 flex-none text-violet-600" />{suggestion.text}</span>
                  <span className="mt-2 block text-xs font-medium leading-relaxed text-slate-500">{suggestion.reason}</span>
                </button>
              ))}
            </div>
          )}

          {copiedText && <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-center text-xs font-bold text-emerald-700">추천 문구를 클립보드에 복사했어요.</p>}
          <p className="mt-5 text-[11px] font-medium leading-relaxed text-slate-400">{selected ? '미리보기는 DOM에만 임시 적용되며 새로고침하거나 패널을 닫으면 원문으로 돌아옵니다.' : '추천 문구를 누르면 클립보드에 복사됩니다.'}</p>
        </aside>
      )}
    </div>
  );
}
