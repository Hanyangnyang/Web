import { useEffect, useRef, useState } from 'react';
import { useReportSong } from '../../../hooks/playlist/useReportSong.js';

export const REPORT_REASONS = ['부적절하거나 선정적인 표현', '욕설·비속어 포함', '스팸/광고성 게시글', '기타'];

// 신고하기 더보기 메뉴 → 사유 선택 팝업 → 접수 토스트로 이어지는 흐름을 공유하는 훅.
// PostDetailCard/TrackPostCollectionView가 각자 들고 있던 동일한 state+핸들러를 하나로 모음.
//
// openMenuKey: "지금 어떤 항목의 더보기 메뉴가 열려 있는지" 식별하는 키 — 게시글이 하나뿐인 화면은
// 아무 고정 문자열이나 넘기면 되고(토글 스위치처럼 동작), 목록 화면은 게시글 id를 그대로 넘기면 됨.
// reportTargetId는 실제로 신고 API에 보낼 게시글 id — undefined면 confirmReport가 조용히 무시함
export function useSongReport() {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [reportTargetId, setReportTargetId] = useState<string | undefined>(undefined);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const reportSong = useReportSong();

  // 더보기 메뉴가 열려있을 때, 메뉴/버튼 바깥을 누르면 닫음
  useEffect(() => {
    if (!openMenuKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuKey(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuKey]);

  const toggleMenu = (key: string) => setOpenMenuKey((prev) => (prev === key ? null : key));
  const closeMenu = () => setOpenMenuKey(null);

  const openReasonPopup = (targetId: string | undefined) => {
    closeMenu();
    setReportTargetId(targetId);
  };
  const closeReasonPopup = () => {
    setReportTargetId(undefined);
    setSelectedReason(null);
  };

  const confirmReport = () => {
    if (!reportTargetId || !selectedReason) return;
    reportSong.mutate(
      { songId: reportTargetId, reason: selectedReason },
      {
        onSuccess: () => {
          closeReasonPopup();
          setToast('신고가 접수됐어요. 검토 후 조치할게요.');
          setTimeout(() => setToast(''), 2000);
        },
      }
    );
  };

  return {
    menuRef,
    openMenuKey,
    toggleMenu,
    reportTargetId,
    openReasonPopup,
    closeReasonPopup,
    selectedReason,
    setSelectedReason,
    confirmReport,
    isPending: reportSong.isPending,
    isError: reportSong.isError,
    toast,
  };
}
