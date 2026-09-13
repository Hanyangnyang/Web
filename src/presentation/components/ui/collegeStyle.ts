// 단과대별 색상 (Tailwind 클래스) — 앱 전역에서 "어느 과인지"를 색으로 나타낼 때 쓴다.
// UI 관심사라 도메인 레이어(PartnerStore.ts)에 두지 않고 여기 분리한다.
import { collegeByName } from '../../../domain/entities/College.js';

/**
 * 단과대 id → 배경·글자색. 제휴 매장 시트처럼 college_id를 들고 있는 쪽이 직접 쓴다.
 *
 * 색상은 전부 서로 다른 계열이어야 한다 — 한 화면에 두 단과대 칩이 나란히 뜨는 곳이
 * 여럿이라(매장 상세의 혜택 카드, 교내시설의 주요 단과대) 같은 색이 둘이면 구분이 안 된다.
 * 현재 쓰인 계열: 주황·빨강·회색·연빨강·보라·초록·노랑·파랑·분홍·청록.
 * 단과대를 추가한다면 위 목록에 없는 계열에서 고를 것.
 */
export const COLLEGE_STYLE: Record<string, string> = {
  '1': 'bg-[rgba(254,215,170,0.5)] text-[#1f2937]',
  '2': 'bg-[rgba(254,202,202,0.5)] text-[#1f2937]',
  '3': 'bg-[rgba(229,231,235,0.6)] text-[#1f2937]',
  '4': 'bg-[rgba(254,226,226,0.5)] text-[#1f2937]',
  '5': 'bg-[rgba(233,213,255,0.5)] text-[#1f2937]',
  '6': 'bg-[rgba(187,247,208,0.5)] text-[#1f2937]',
  '7': 'bg-[rgba(254,240,138,0.5)] text-[#1f2937]',
  '8': 'bg-[rgba(191,219,254,0.5)] text-[#1f2937]',
  '9': 'bg-[rgba(251,207,232,0.5)] text-[#1f2937]',
  '10': 'bg-[rgba(165,243,252,0.6)] text-[#1f2937]',
};

/** 단과대가 아니거나(대학본부·학군단 등) 이름을 못 알아본 경우의 기본 칩 색 */
export const NEUTRAL_COLLEGE_STYLE = 'bg-surface text-text-main';

/**
 * 단과대 '이름'으로 칩 색을 얻는다.
 * 교내시설 데이터(campusBuildings.json의 primaryColleges)는 id가 아니라 이름 문자열을 담고 있어서
 * College.ts의 이름 조회를 한 번 거친다.
 * 대학본부·사회교육원·학군단처럼 단과대가 아닌 값도 그대로 들어오므로,
 * 못 찾으면 색을 지어내지 않고 중립색으로 떨어뜨린다.
 */
export function collegeStyleByName(name: string): string {
  const college = collegeByName(name);
  return (college && COLLEGE_STYLE[college.id]) || NEUTRAL_COLLEGE_STYLE;
}
