import { useState } from 'react';
import { SongShareModal, type SongShareModalSong } from './SongShareModal';
import { Toast } from './Toast';

// 공유 모달 + "링크 복사됨!" 토스트 상태를 함께 관리 — ChartSongRow/FloatingSpotifyPlayer/PostDetailCard/
// TrackPostCollectionView가 각자 들고 있던 동일한 state+마크업을 하나로 모음.
// node를 렌더 트리 어딘가(보통 카드/화면 최상위)에 그대로 꽂아두면 열림/닫힘과 토스트를 알아서 처리함
export function useShareModal(song: SongShareModalSong) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const open = () => setIsOpen(true);

  const node = (
    <>
      {isOpen && (
        <SongShareModal
          song={song}
          onClose={() => setIsOpen(false)}
          onCopied={() => {
            setCopiedToast(true);
            setTimeout(() => setCopiedToast(false), 1800);
          }}
        />
      )}
      {copiedToast && <Toast message="링크 복사됨!" />}
    </>
  );

  return { open, node };
}
