import type { ComponentType } from 'react';
import { LibraryStatusCard } from './LibraryStatusCard.jsx';
import { createLibraryRoom } from '../../../domain/entities/LibraryRoom.js';
import type { LibraryStatus } from '../../../domain/repositories/ILibraryRepository.js';

// ── mock 데이터 생성기 ─────────────────────────────────────────────
// 혼잡도 등급은 도메인이 점유율로 계산하므로, 등급을 직접 넣지 않고
// 원하는 등급이 나오는 좌석 수를 넘긴다. 계산 규칙이 바뀌면 스토리도 같이 따라간다.
function makeRoom(id: string, name: string, total: number, occupied: number) {
  return createLibraryRoom({ id, name, total, occupied, available: total - occupied });
}

function makeStatus(list: LibraryStatus['list']): LibraryStatus {
  return { list, updatedAt: '2026-08-14 01:24:00' };
}

// 네 등급이 한 화면에 다 나오도록 점유율을 배치
const ALL_GRADES = makeStatus([
  makeRoom('FIRST_READING_ROOM', '제1열람실', 321, 60),    // 19% → 쾌적
  makeRoom('SECOND_READING_ROOM', '제2열람실 (4F)', 216, 90), // 42% → 보통
  makeRoom('HOLMZ', '노상일 HOLMZ', 82, 50),                // 61% → 혼잡
  makeRoom('QUIET_ROOM', '집중열람실', 12, 11),             // 92% → 매우 혼잡
]);

const CARD_WIDTH = 375;

const mobileFrame = (Story: ComponentType) => (
  <div style={{ maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', padding: '16px' }}>
    <Story />
  </div>
);

export default {
  title: '소식탭/LibraryStatusCard',
  component: LibraryStatusCard,
};

// ── 상태 분기 전수: 컴포넌트의 return 순서와 같은 순서로 나열 ─────────
// 1) 로딩 → 2) 실패 → 3) 비어있음 → 4) 정상

export const 로딩중 = {
  decorators: [mobileFrame],
  args: { library: null, loading: true },
};

// 조회에 실패했고 캐시된 이전 데이터도 없을 때만 안내가 뜬다
export const 조회실패 = {
  decorators: [mobileFrame],
  args: { library: null, loading: false, error: new Error('network error') },
};

// 실패했지만 캐시가 있으면 안내 대신 그 데이터를 계속 보여준다.
// 지하철에서 잠깐 끊겼다고 화면이 안내문으로 바뀌면 안 되기 때문.
export const 실패했지만캐시있음 = {
  decorators: [mobileFrame],
  args: { library: ALL_GRADES, loading: false, error: new Error('network error') },
};

// 방학 중 휴관 등 — 응답은 성공했는데 운영 중인 열람실이 없는 경우.
// 빈 배열은 truthy라 length로 판단해야 여기 걸린다.
export const 운영중인열람실없음 = {
  decorators: [mobileFrame],
  args: { library: makeStatus([]), loading: false },
};

export const 정상 = {
  decorators: [mobileFrame],
  args: { library: ALL_GRADES, loading: false },
};

// ── 혼잡도 등급 4종을 한 눈에 비교 ────────────────────────────────
// 점유율 경계(33% / 50% / 67%)를 사이에 두고 색·이모지·막대 길이가 어떻게 갈리는지 검수한다
const GRADE_SAMPLES = [
  { label: '쾌적 (33% 이하)', room: makeRoom('FIRST_READING_ROOM', '제1열람실', 100, 33) },
  { label: '보통 (33~50%)', room: makeRoom('SECOND_READING_ROOM', '제2열람실', 100, 50) },
  { label: '혼잡 (50~67%)', room: makeRoom('HOLMZ', '노상일 HOLMZ', 100, 67) },
  { label: '매우 혼잡 (67% 초과)', room: makeRoom('QUIET_ROOM', '집중열람실', 100, 90) },
];

export const 등급별비교 = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', padding: '16px' }}>
      {GRADE_SAMPLES.map(({ label, room }) => (
        <div key={label}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', margin: '0 0 6px' }}>{label}</p>
          <LibraryStatusCard library={makeStatus([room])} loading={false} />
        </div>
      ))}
    </div>
  ),
};

// 이름이 길어 잘리는 경우 — 카드 폭이 좁아 truncate가 걸리는지 확인
export const 긴이름 = {
  decorators: [mobileFrame],
  args: {
    library: makeStatus([
      makeRoom('FIRST_READING_ROOM', '아주 긴 이름을 가진 제1열람실 (2F)', 321, 100),
      makeRoom('SECOND_READING_ROOM', '제2열람실 (4F)', 216, 100),
    ]),
    loading: false,
  },
};
