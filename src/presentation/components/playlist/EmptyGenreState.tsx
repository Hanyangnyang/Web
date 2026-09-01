import { Plus } from 'lucide-react';

interface EmptyGenreStateProps {
  // 클릭 시 동작 — 화면마다 다를 수 있음(곡추천하기로 이동/최근추가된곡으로 이동 등)
  onAction: () => void;
  // 화면마다 문맥이 달라서(장르 필터 결과 없음/저장한 곡 없음 등) 문구를 오버라이드할 수 있게 함
  message?: string;
  buttonLabel?: string;
  // true면 최근추가된곡 화면의 카드 그리드와 같은 카드 박스 스타일로 표시
  boxed?: boolean;
}

const DEFAULT_MESSAGE = '아직 이 장르로 등록된 곡이 없어요';
const DEFAULT_BUTTON_LABEL = '첫 곡 추천하러 가기';

// 곡 목록이 0개일 때 공통으로 쓰는 안내 + 유도 버튼. 문구/동작은 화면마다 오버라이드 가능
export function EmptyGenreState({ onAction, message = DEFAULT_MESSAGE, buttonLabel = DEFAULT_BUTTON_LABEL, boxed = false }: EmptyGenreStateProps) {
  return (
    <button
      onClick={onAction}
      className={`w-full flex flex-col items-center justify-center gap-1.5 py-10 px-4 text-center transition-colors active:scale-[0.98] ${
        boxed ? 'bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50' : ''
      }`}
    >
      <span className="text-2xl">🎵</span>
      <p className="text-sm font-semibold text-text-main">{message}</p>
      <span className="flex items-center gap-1 mt-1 px-3 py-1.5 rounded-full bg-[#2B3B52] text-white shadow-[0_4px_10px_rgba(43,59,82,0.3)] text-xs font-bold">
        <Plus size={14} strokeWidth={2.5} />
        {buttonLabel}
      </span>
    </button>
  );
}
