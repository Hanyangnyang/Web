import { MoreVertical } from 'lucide-react';
import { type useSongReport } from './useSongReport';

interface PostMoreMenuProps {
  report: ReturnType<typeof useSongReport>;
  // "지금 이 항목의 더보기 메뉴가 열려 있는지" 식별하는 키 — useSongReport의 openMenuKey/toggleMenu와 짝을 이룸.
  // 게시글이 하나뿐인 화면(PostDetailCard)은 고정 문자열('more'), 목록 화면(TrackPostCollectionView)은
  // 게시글 id를 그대로 넘기면 됨(같은 화면에 여러 개가 동시에 열리지 않게)
  menuKey: string;
  // 신고 API에 실제로 보낼 게시글 id — 없으면(더미 게시글 등) confirmReport가 조용히 무시함
  reportTargetId: string | undefined;
}

// 앨범 커버/제목 행 오른쪽에 붙는 "더보기 → 신고하기" 드롭다운 — PostDetailCard/TrackPostCollectionView가
// 각자 들고 있던 동일한 마크업을 하나로 모음(상태는 이미 useSongReport로 공유하고 있었음)
export function PostMoreMenu({ report, menuKey, reportTargetId }: PostMoreMenuProps) {
  return (
    <div
      ref={report.openMenuKey === menuKey ? report.menuRef : undefined}
      className="relative inline-block flex-shrink-0"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          report.toggleMenu(menuKey);
        }}
        aria-label="더보기"
        className="active:scale-90 transition-transform"
      >
        <MoreVertical size={18} className="text-text-sub" />
      </button>

      {report.openMenuKey === menuKey && (
        <div className="absolute top-full right-0 mt-0.5 z-20 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              report.openReasonPopup(reportTargetId);
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-slate-50 whitespace-nowrap"
          >
            신고하기
          </button>
        </div>
      )}
    </div>
  );
}
