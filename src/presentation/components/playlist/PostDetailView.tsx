import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { PostDetailCard, type PostDetailCardData } from './PostDetailCard';

interface PostDetailViewProps {
  onBack: () => void;
}

// UI 디자인용 임시 더미 — 실제로는 클릭해서 들어온 게시글 데이터로 교체될 예정
const DUMMY_POST: PostDetailCardData = {
  albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
  title: 'Busy Boy',
  artist: '주혜린',
  body: '이 노래 진짜 좋아! 베이스 라인이 미쳤어, 이런 감성의 R&B는 진짜 오랜만이에요 ㅠㅠ 요즘 계속 듣는 중인데 질리지가 않아요.',
  genres: ['R&B', '인디', '발라드'],
};

// 게시글 조회(단건) 화면 — 헤더는 항상 홈과 동일. 데이터는 아직 더미
export function PostDetailView({ onBack }: PostDetailViewProps) {
  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들에게 곡을 추천해주세요!"
        onBack={onBack}
      />

      <PostDetailCard post={DUMMY_POST} />
    </div>
  );
}
