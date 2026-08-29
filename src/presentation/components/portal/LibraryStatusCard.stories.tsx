import type { ComponentType } from 'react';
import { LibraryStatusCard } from './LibraryStatusCard.jsx';
import { createLibraryRoom, type LibraryRoomInput } from '../../../domain/entities/LibraryRoom.js';
import type { LibraryStatus } from '../../../domain/repositories/ILibraryRepository.js';

// 실제 앱 화면(iPhone SE/8 기준) 카드 폭 — WeatherCard.stories.tsx와 동일 기준
const CARD_WIDTH = 375;

const mobileFrame = (Story: ComponentType) => (
  <div style={{ maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', paddingTop: '16px' }}>
    <Story />
  </div>
);

// LibraryRepository.getStatus()와 동일하게 LibraryRoomInput[] → createLibraryRoom으로 변환
// (ratio/status 판정 로직을 여기서 재구현하지 않고 실제 도메인 함수를 그대로 사용, color/emoji는 카드의 STATUS_STYLE이 담당)
function makeLibrary(rooms: LibraryRoomInput[]): LibraryStatus {
  return { list: rooms.map(createLibraryRoom), updatedAt: '2026-08-12 14:27:00' };
}

// 실제 LibraryRepository의 LIBRARY_SORT_ORDER(FIRST_READING_ROOM, SECOND_READING_ROOM, HOLMZ, QUIET_ROOM)와 동일한 4개 열람실 구성.
// 4가지 혼잡도 등급(쾌적/보통/혼잡/매우 혼잡)이 한 카드 안에서 모두 보이도록 좌석 비율을 배분.
const 혼합상태_열람실: LibraryRoomInput[] = [
  { id: 'FIRST_READING_ROOM', name: '제1열람실', total: 100, occupied: 28, available: 72 },        // 0.28 → 쾌적
  { id: 'SECOND_READING_ROOM', name: '제2열람실 (4F)', total: 218, occupied: 95, available: 123 },  // 0.44 → 보통
  { id: 'HOLMZ', name: '홀름즈 열람실 (2F)', total: 60, occupied: 38, available: 22 },              // 0.63 → 혼잡
  { id: 'QUIET_ROOM', name: '정숙 열람실 (2F)', total: 20, occupied: 15, available: 5 },             // 0.75 → 매우 혼잡
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

// ── 빈 상태 분기 (library?.list && length > 0 이 false인 두 가지 경로) ─────
export const 정보없음_빈목록 = {
  decorators: [mobileFrame],
  args: { library: { list: [], updatedAt: '2026-08-12 14:27:00' }, loading: false },
};

export const 조회실패_null = {
  decorators: [mobileFrame],
  args: { library: null, loading: false },
};
