// 바텀시트가 '자기 실제 높이'를 화면에 알리는 통로.
//
// 시트 위에 떠 있어야 하는 플로팅 버튼은 시트 높이를 알아야 하는데, 시트 높이가 내용에 따라
// 달라지면(height:auto) 계산으로는 알 수 없다. 그렇다고 React 상태로 올리면 높이 트랜지션
// 매 프레임마다 화면 전체가 리렌더된다 — 그래서 값은 DOM(CSS 변수)에 직접 쓴다.
//
// 다만 '어느 DOM에 쓸지'를 시트가 parentElement로 추측하면, 시트를 한 겹만 감싸도 조용히
// 어긋난다. 그래서 쓰는 주체(화면)가 콜백을 내려주고, 시트는 값만 보고하도록 계약을 드러낸다.
import { createContext, useContext } from 'react';

/** 시트 높이 보고 — 시트가 사라질 땐 null을 보내 "시트 없음"을 알린다 */
export type ReportSheetHeight = (heightPx: number | null) => void;

export const SheetHeightContext = createContext<ReportSheetHeight | null>(null);

/** Provider가 없으면 null — 시트를 단독으로 쓰는 화면에서도 그냥 동작한다 */
export function useReportSheetHeight(): ReportSheetHeight | null {
  return useContext(SheetHeightContext);
}
