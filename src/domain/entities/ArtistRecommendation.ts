// 도메인 엔티티: 소식탭 플레이리스트 배너용 가수·대표곡 추천 카드 (새 백엔드 /api/v1/playlist/recommendations)
export interface RecommendedArtist {
  id: string;
  name: string;
  // 사진이 없는 가수는 null — 화면이 기본 이미지로 처리
  imageUrl: string | null;
}

// 추천 출처 — INTEREST(최근 재생·좋아요·작성 기반 관심 가수), DISCOVERY(선호 카테고리의 새 가수), WEEKLY_CHART(개인화 후보 부족 시 주간차트 보충)
export type RecommendationSource = 'INTEREST' | 'DISCOVERY' | 'WEEKLY_CHART';

export interface ArtistRecommendation {
  // 카드의 대표 가수 한 명
  artist: RecommendedArtist;
  track: {
    trackId: string;
    title: string;
    albumArtUrl: string | null;
    // 곡에 참여한 전체 가수(협업곡 포함) — 서버가 내려준 순서 그대로 표시
    artists: RecommendedArtist[];
  };
  source: RecommendationSource;
}

export function createArtistRecommendation(raw: ArtistRecommendation): ArtistRecommendation {
  return { ...raw };
}
