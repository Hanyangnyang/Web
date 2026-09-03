import { type ReactNode } from 'react';

interface ConfirmPopupProps {
  // 팝업 본문(제목/설명/목록 등) — 팝업마다 구성이 달라 그대로 children으로 받음
  children: ReactNode;
  // 하단 버튼 영역 — 2개를 가로로 나란히 두거나 3개를 세로로 쌓는 등 팝업마다 배치가 달라 그대로 children으로 받음
  buttons: ReactNode;
}

// 화면 중앙 확인/안내 팝업의 공용 셸(반투명 배경 + 흰 카드) — RecommendSongView의 재시도/등록 전 안내/
// 뒤로가기 확인 팝업 3곳이 거의 동일한 래퍼 마크업을 반복하고 있어 하나로 모음
export function ConfirmPopup({ children, buttons }: ConfirmPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
      <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl px-5 py-5">
        {children}
        {buttons}
      </div>
    </div>
  );
}
