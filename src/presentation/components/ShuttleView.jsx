// 컴포넌트: 셔틀버스 시간표 및 한대앞역 실시간 지하철 연결 정보 표시
import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { STOPS, SUBWAY_OPTS, connectingTrains } from '../../domain/entities/Shuttle.js';
import { useShuttle } from '../hooks/useShuttle.js';

// ── 아이콘 ────────────────────────────────────────────────────────────────────
const IcBed = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20V10h20v10M2 10V8a2 2 0 012-2h5a2 2 0 012 2v2M13 10V8a2 2 0 012-2h5a2 2 0 012 2v2" />
  </svg>
);
const IcSchool = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M3 10l9-7 9 7M5 21V10M19 21V10M9 21V15h6v6" />
  </svg>
);
const IcSubway = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="13" rx="3" />
    <path d="M4 10h16" />
    <circle cx="9" cy="16" r="2" /><circle cx="15" cy="16" r="2" />
  </svg>
);
const IcBus = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M2 11h20" />
    <circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" />
  </svg>
);

const STOP_ICON = { '기숙사': IcBed, '셔틀콕': IcSchool, '한대앞': IcSubway, '셔틀콕 건너편': IcSchool, '예술인': IcBus, '중앙역': IcSubway };

const ROUTE_LABEL = { 'DH': '직행', 'D': '직행', 'DY': '예술인\n직행', 'C': '순환', '중앙역': '순환' };

// ── 지하철 노선 뱃지 ──────────────────────────────────────────────────────────
function LineBadge({ opt, size = 32 }) {
  const is4 = opt.line === '4호선';
  return (
    <div className="stt-lb" style={{ width: size, height: size, background: opt.color }}>
      {is4
        ? <span className="stt-lb-4" style={{ fontSize: size * 0.5 }}>4</span>
        : <span className="stt-lb-sb" style={{ fontSize: size * 0.22 }}>수인<br />분당</span>
      }
    </div>
  );
}

// ── 지하철 노선 드롭다운 ──────────────────────────────────────────────────────
function SubwayDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opt = SUBWAY_OPTS.find(o => o.id === selected);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const line4 = SUBWAY_OPTS.filter(o => o.line === '4호선');
  const sb = SUBWAY_OPTS.filter(o => o.line === '수인분당선');

  return (
    <div className="stt-dd-wrap" ref={ref}>
      <div className={`stt-dd-trigger${open ? ' open' : ''}`} onClick={() => setOpen(p => !p)}>
        <LineBadge opt={opt} size={28} />
        <div className="stt-dd-trigger-text">
          <span className="stt-dd-trigger-line">{opt.line} · {opt.dir}</span>
          <span className="stt-dd-trigger-dest">{opt.dest}</span>
        </div>
        <svg className={`stt-dd-arrow${open ? ' open' : ''}`} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="stt-dd-panel">
          {[{ label: '4호선', items: line4 }, { label: '수인분당선', items: sb }].map(({ label, items }) => (
            <div key={label}>
              <div className="stt-dd-group-label">
                <LineBadge opt={items[0]} size={18} /><span>{label}</span>
              </div>
              {items.map(o => (
                <div key={o.id} className={`stt-dd-opt${selected === o.id ? ' sel' : ''}`}
                  onClick={() => { onChange(o.id); setOpen(false); }}>
                  <div className="stt-dd-opt-info">
                    <p className="stt-dd-opt-main">{o.dest}</p>
                    <p className="stt-dd-opt-sub">{o.dir} · 한대앞역 출발</p>
                  </div>
                  <div className={`stt-dd-radio${selected === o.id ? ' sel' : ''}`}>
                    {selected === o.id && <div className="stt-dd-dot" />}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 시간표 행 ─────────────────────────────────────────────────────────────────
function TimetableRow({ row, lineId, isNext, isLast, isPast, subwayArrivals, subwayOffPeak, isSubwayLoading, hideSubwayCol }) {
  const opt = SUBWAY_OPTS.find(o => o.id === lineId);
  const trains = row.subway ? connectingTrains(subwayArrivals, row.arr, lineId) : [];
  const noTrainReason = row.subway && trains.length === 0
    ? (subwayOffPeak ? '운행 시간 외' : '연결 열차 없음') : null;

  const rLabel = ROUTE_LABEL[row.route] || row.route;
  const routeClass = row.route === 'DY' ? 'dy' : (row.route === 'C' || row.route === '중앙역' ? 'c' : 'd');

  return (
    <div className={`stt-trow${isNext ? ' next' : ''}${isPast ? ' past' : ''}`}>
      {isPast && <div className="stt-past-tag">이전 셔틀{isLast && <span className="stt-mak-badge">막</span>}</div>}
      {isNext && <div className="stt-next-tag">다음 셔틀{isLast && <span className="stt-mak-badge">막</span>}</div>}
      {isLast && !isNext && !isPast && <div className="stt-last-tag">마지막 셔틀</div>}

      <div className="stt-shuttle-col" style={{ paddingTop: (isNext || isLast || isPast) ? 26 : 16, flex: hideSubwayCol ? 1 : '0 0 52%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className={`stt-route-label ${routeClass}`}>{rLabel}</span>
          <div>
            <span className="stt-time-big">{row.dep}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-hint)" strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span style={{ fontSize: 12, color: 'var(--color-text-hint)', fontWeight: 600 }}>
                {row.arrLabel} {row.arr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!hideSubwayCol && (
        <div className="stt-subway-col" style={{ paddingTop: (isNext || isLast || isPast) ? 26 : 14 }}>
          {row.subway ? (
            isSubwayLoading ? (
              <div className="stt-subway-loader-wrap">
                <Loader2 className="stt-subway-loader" size={16} />
              </div>
            ) : trains.length > 0 ? trains.map((tr, i) => (
              <div key={i} className="stt-subway-row">
                <LineBadge opt={opt} size={20} />
                <span className="stt-subway-dest">{tr.dest}행</span>
                <span className="stt-subway-time">{tr.arrTime}</span>
              </div>
            )) : <span className="stt-no-train">{noTrainReason}</span>
          ) : <span className="stt-no-train">—</span>}
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function ShuttleView() {
  const {
    stop, setStop,
    lineId, setLineId,
    schedule, nextIdx, now,
    subwayArrivals, subwayOffPeak,
    isHolidayServer, isWeekend,
    needsSubway,
    loadErr, isLoading, isSubwayLoading,
    visibleCount, loadMore,
    isFullMode, setIsFullMode,
    fullDayType, setFullDayType,
  } = useShuttle();

  const [showTooltip, setShowTooltip] = useState(true);
  const [initialStop] = useState(stop);

  const HIDE_COL_STOPS = ['한대앞', '셔틀콕 건너편', '예술인', '중앙역'];
  const hideSubwayCol = HIDE_COL_STOPS.includes(stop);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (loadErr) return <div className="stt-container"><div className="stt-empty"><p>{loadErr}</p></div></div>;
  if (isLoading) return <div className="stt-container"><div className="stt-empty"><p>불러오는 중…</p></div></div>;

  return (
    <div className="stt-container">
      {/* 출발지 선택 */}
      <div className="stt-section">
        <p className="stt-sec-label">출발지</p>
        <div className="stt-stops-grid">
          {STOPS.map((s, idx) => {
            const Icon = STOP_ICON[s];
            return (
              <div key={s} className={`stt-stop-chip${stop === s ? ' active' : ''}`} onClick={() => setStop(s)} style={{ position: 'relative' }}>
                {initialStop === s && showTooltip && (
                  <div className={`stt-tooltip ${idx >= 3 ? 'bottom' : 'top'}`}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    잠깐! 이 출발지가 맞나요?
                  </div>
                )}
                <Icon /> {s}
              </div>
            );
          })}
        </div>
      </div>

      {/* 시간표 */}
      <div className="stt-section">
        <div className="stt-section-header" style={{ alignItems: 'center' }}>
          <div>
            <div className="stt-sec-label" style={{ marginBottom: 2 }}>
              시간표
              {!isFullMode && (isWeekend ? (
                <span className="stt-holiday-badge">주말</span>
              ) : isHolidayServer ? (
                <span className="stt-holiday-badge">공휴일</span>
              ) : null)}
            </div>
          </div>

          {isFullMode && (
            <div style={{
              display: 'flex',
              background: 'var(--color-surface-variant)',
              borderRadius: 8,
              padding: 2,
              border: '1px solid rgba(0,0,0,0.05)',
              marginLeft: 16,
              marginRight: 8
            }}>
              <button
                onClick={() => setFullDayType('평일')}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 12,
                  background: fullDayType === '평일' ? 'white' : 'transparent',
                  color: fullDayType === '평일' ? 'var(--color-primary)' : 'var(--color-text-hint)',
                  boxShadow: fullDayType === '평일' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                평일
              </button>
              <button
                onClick={() => setFullDayType('주말')}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 12,
                  background: fullDayType === '주말' ? 'white' : 'transparent',
                  color: fullDayType === '주말' ? 'var(--color-primary)' : 'var(--color-text-hint)',
                  boxShadow: fullDayType === '주말' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                주말/공휴일
              </button>
            </div>
          )}

          <div style={{ marginLeft: 'auto' }}>
            {needsSubway && <SubwayDropdown selected={lineId} onChange={setLineId} />}
          </div>
        </div>

        <div className="stt-col-header" style={{ position: 'relative' }}>
          <div style={{ flex: hideSubwayCol ? 1 : '0 0 52%', paddingLeft: 90 }} className="stt-col-label">출발 시간</div>
          {!hideSubwayCol && (
            <div style={{ flex: 1, paddingLeft: 4 }} className="stt-col-label">
              {needsSubway ? '연결 지하철' : '도착'}
            </div>
          )}

          <div style={{ 
            position: 'absolute', right: 0, top: -2,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div
              onClick={() => setIsFullMode(!isFullMode)}
              style={{
                width: 38, height: 21, borderRadius: 20, padding: 2, cursor: 'pointer',
                background: isFullMode ? 'var(--color-primary)' : '#e0e0e0',
                position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                width: 17, height: 17, borderRadius: '50%', background: 'white',
                boxShadow: '0 2px 3px rgba(0,0,0,0.15)',
                position: 'absolute', top: 2,
                left: isFullMode ? 19 : 2,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: isFullMode ? 'var(--color-primary)' : 'var(--color-text-hint)',
                whiteSpace: 'nowrap'
              }}
            >
              전체 시간표
            </span>
          </div>
        </div>

        <div className="stt-tcard">
          {schedule.length > 0 ? (
            (isFullMode ? schedule : schedule.slice(0, visibleCount)).map((row, i) => (
              <TimetableRow
                key={i}
                row={row}
                lineId={lineId}
                isNext={!isFullMode && i === nextIdx && nextIdx !== -1}
                isLast={row.isLast || i === schedule.length - 1}
                isPast={!isFullMode && row.depMin < now}
                subwayArrivals={subwayArrivals}
                subwayOffPeak={subwayOffPeak}
                isSubwayLoading={isSubwayLoading}
                hideSubwayCol={hideSubwayCol}
              />
            ))
          ) : (
            <div className="stt-empty large"><p>오늘 남은 셔틀이 없습니다</p></div>
          )}
        </div>

        {!isFullMode && schedule.length > visibleCount && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <button className="qr-refresh-btn" onClick={loadMore} style={{ width: 'auto', padding: '8px 24px' }}>
              <ChevronDown size={16} />
              더 불러오기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
