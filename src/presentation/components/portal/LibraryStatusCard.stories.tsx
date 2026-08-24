import type { ComponentType } from 'react';
import { BookOpen } from 'lucide-react';
import { LibraryStatusCard } from './LibraryStatusCard.jsx';
import { createLibraryRoom, type LibraryRoomInput, type LibraryRoom } from '../../../domain/entities/LibraryRoom.js';
import type { LibraryStatus } from '../../../domain/repositories/IPortalRepository.js';

// 실제 앱 화면(iPhone SE/8 기준) 카드 폭 — WeatherCard.stories.tsx와 동일 기준
const CARD_WIDTH = 375;

const mobileFrame = (Story: ComponentType) => (
  <div style={{ maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', paddingTop: '16px' }}>
    <Story />
  </div>
);

// PortalRepository.getLibrary()와 동일하게 LibraryRoomInput[] → createLibraryRoom으로 변환
// (ratio/status/color/emoji 판정 로직을 여기서 재구현하지 않고 실제 도메인 함수를 그대로 사용)
function makeLibrary(rooms: LibraryRoomInput[]): LibraryStatus {
  return { list: rooms.map(createLibraryRoom), updatedAt: Date.now() };
}

// 실제 PortalRepository의 LIBRARY_SORT_ORDER(61, 63, 132, 131)와 동일한 4개 열람실 구성.
// 4가지 혼잡도 등급(쾌적/보통/혼잡/매우 혼잡)이 한 카드 안에서 모두 보이도록 좌석 비율을 배분.
const 혼합상태_열람실: LibraryRoomInput[] = [
  { id: 61, name: '제1열람실', total: 100, occupied: 28 },        // 0.28 → 쾌적
  { id: 63, name: '제2열람실 (4F)', total: 218, occupied: 95 },   // 0.44 → 보통
  { id: 132, name: '제3열람실 (2F)', total: 60, occupied: 38 },   // 0.63 → 혼잡
  { id: 131, name: '가족열람실 (2F)', total: 20, occupied: 15 },  // 0.75 → 매우 혼잡
];

export default {
  title: '소식탭/LibraryStatusCard',
  component: LibraryStatusCard,
};

// ── 로딩 분기 ─────────────────────────────────────────────
export const 로딩스켈레톤 = {
  decorators: [mobileFrame],
  args: { library: null, loading: true },
};

// ── 정상 데이터 분기 (혼합 상태 + 층수 배지) ──────────────────
export const 정상데이터 = {
  decorators: [mobileFrame],
  args: { library: makeLibrary(혼합상태_열람실), loading: false },
};

// 이름에 "(2F)" 같은 괄호가 없을 때 층수 배지가 사라지는지 확인 (LibraryStatusCard.tsx의 floorMatch 정규식 분기)
export const 층수배지없음 = {
  decorators: [mobileFrame],
  args: {
    library: makeLibrary(혼합상태_열람실.map((room) => ({ ...room, name: room.name.replace(/\s*\(.*?\)/, '') }))),
    loading: false,
  },
};

// 4칸이 전부 같은 등급일 때 색상/문구가 어떻게 보이는지 (극단값 검수)
export const 전체쾌적 = {
  decorators: [mobileFrame],
  args: {
    library: makeLibrary(혼합상태_열람실.map((room) => ({ ...room, occupied: Math.round(room.total * 0.2) }))),
    loading: false,
  },
};

export const 전체매우혼잡 = {
  decorators: [mobileFrame],
  args: {
    library: makeLibrary(혼합상태_열람실.map((room) => ({ ...room, occupied: Math.round(room.total * 0.95) }))),
    loading: false,
  },
};

// ── 빈 상태 분기 (library?.list && length > 0 이 false인 두 가지 경로) ─────
export const 정보없음_빈목록 = {
  decorators: [mobileFrame],
  args: { library: { list: [], updatedAt: Date.now() }, loading: false },
};

export const 조회실패_null = {
  decorators: [mobileFrame],
  args: { library: null, loading: false },
};

// ── 실험: "석 남음" 큰 숫자에도 등급색을 적용하면 어떨지 비교 ─────────────
// 실제 LibraryStatusCard.tsx는 건드리지 않고, 그 마크업을 그대로 복제한 뒤
// text-[#0E4A84] 고정색만 room.color로 바꿔서 나란히 비교한다. 채택 시
// LibraryStatusCard.tsx L74 근처 <span className="text-base font-black text-[#0E4A84] ...">를
// style={{ color: room.color }}로 바꾸면 된다.
function ColoredNumberVariant({ library }: { library: LibraryStatus }) {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.06),0_2px_8px_-2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(15,23,42,0.03)] select-none">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-[#0E4A84] flex-shrink-0">
            <BookOpen size={14} />
          </div>
          <h3 className="text-[0.88rem] font-extrabold text-slate-800">학술정보관 열람실</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">실시간 좌석</span>
      </div>

      <div className="grid grid-cols-2">
        {library.list.map((room: LibraryRoom, idx: number) => {
          const emptySeats = Math.max(0, room.total - room.occupied);
          const floorMatch = room.name.match(/\((.*?)\)/);
          const floor = floorMatch ? floorMatch[1] : null;
          const cleanName = room.name.replace(/\s*\([^)]*\)/, '');
          const isRight = idx % 2 === 1;
          const isBottom = idx >= 2;
          const borderClass = `${!isRight ? 'border-r border-slate-100' : ''} ${!isBottom ? 'border-b border-slate-100' : ''}`;
          const paddingClass = `${!isRight ? 'pr-3' : 'pl-3'} ${!isBottom ? 'pb-2.5' : 'pt-2.5'}`;

          return (
            <div key={room.id} className={`flex flex-col justify-between gap-1.5 ${borderClass} ${paddingClass}`}>
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-extrabold text-[0.8rem] text-slate-800 truncate">{cleanName}</span>
                  {floor && (
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.2 rounded flex-shrink-0">
                      {floor}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold flex-shrink-0" style={{ color: room.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: room.color }} />
                  {room.status}
                </span>
              </div>

              <div className="flex items-baseline gap-1 my-0.5">
                {/* 유일한 변경점: 고정 text-[#0E4A84] 대신 room.color 적용 */}
                <span className="text-base font-black leading-none" style={{ color: room.color }}>
                  {emptySeats}
                </span>
                <span className="text-[11px] font-bold text-slate-600">석 남음</span>
                <span className="text-[9.5px] font-semibold text-slate-400 ml-auto">
                  {room.occupied}/{room.total}
                </span>
              </div>

              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, room.ratio * 100))}%`, backgroundColor: room.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const 숫자컬러_비교 = {
  decorators: [mobileFrame],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <p style={{ fontSize: '12px', fontWeight: 800, color: '#475569', margin: '0 0 6px' }}>
          지금 — 숫자 항상 고정 네이비
        </p>
        <LibraryStatusCard library={makeLibrary(혼합상태_열람실)} loading={false} />
      </div>
      <div>
        <p style={{ fontSize: '12px', fontWeight: 800, color: '#475569', margin: '0 0 6px' }}>
          실험 — 숫자 색을 혼잡도 등급색과 통일
        </p>
        <ColoredNumberVariant library={makeLibrary(혼합상태_열람실)} />
      </div>
    </div>
  ),
};
