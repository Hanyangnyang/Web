import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { PostDetailCard, songToPostDetailCardData, type PostDetailCardData } from './PostDetailCard';
import { usePostDetail } from '../../hooks/useRecentSongs.js';

interface PostDetailViewProps {
  // 게시글 목록에서 눌러서 들어온 게시글 id — GET /api/v1/playlist/songs/{id}로 상세 조회
  postId: string | null;
  onBack: () => void;
}

// 검색 결과의 "게시글" 섹션은 아직 BE 게시글 검색 API가 연결 전이라 id가 없는 더미로 남아있어,
// 그 경로로 들어오면(postId가 없으면) 화면 디자인용 더미로 대체
const DUMMY_POST: PostDetailCardData = {
  albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
  title: 'Busy Boy',
  artist: '주혜린',
  body: '이 노래 진짜 좋아! 베이스 라인이 미쳤어, 이런 감성의 R&B는 진짜 오랜만이에요 ㅠㅠ 요즘 계속 듣는 중인데 질리지가 않아요.',
  genres: ['R&B', '인디', '발라드'],
  createdAt: new Date(Date.now() - 12 * 60 * 1000),
  reactions: [
    { type: 'LOVE', emoji: '😍', count: 3, isReacted: false },
    { type: 'THUMBS_UP', emoji: '👍', count: 5, isReacted: false },
    { type: 'FIRE', emoji: '🔥', count: 1, isReacted: false },
  ],
};

// 게시글 조회(단건) 화면 — 헤더는 항상 홈과 동일
export function PostDetailView({ postId, onBack }: PostDetailViewProps) {
  const { data: post, isLoading } = usePostDetail(postId);

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들에게 곡을 추천해주세요!"
        onBack={onBack}
      />

      {postId && isLoading ? (
        <div className="py-16 text-center text-sm text-text-hint">불러오는 중...</div>
      ) : (
        <PostDetailCard post={post ? songToPostDetailCardData(post) : DUMMY_POST} />
      )}
    </div>
  );
}
