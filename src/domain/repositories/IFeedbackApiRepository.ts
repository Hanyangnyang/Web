// 도메인 레포지토리 인터페이스: 새 백엔드 통합 피드백 접수(POST /api/v1/feedbacks) 계약
// 기능별 category/feedbackType 태깅이 필수인 새 백엔드 엔드포인트. (구현은 data 레이어의 FeedbackApiRepository)
// 예전엔 Supabase 직접 연결의 자유 텍스트 전용 IFeedbackRepository가 따로 있었는데, 모든 화면이 이쪽으로
// 이전 완료되면서 제거했다(기타탭 피드백 -> GENERAL, 캠퍼스맵 제보 -> CAMPUS_MAP/PARTNERSHIP)
export type FeedbackCategory =
  | 'SHUTTLE' | 'CITY_BUS' | 'SUBWAY' | 'CAMPUS_MAP' | 'MENU' | 'GYM'
  | 'LIBRARY' | 'PLAYLIST' | 'WEATHER' | 'PARTNERSHIP' | 'BANNER' | 'GENERAL';

export type FeedbackType = 'BUG_REPORT' | 'INACCURACY' | 'FEATURE_REQUEST' | 'INQUIRY' | 'GENERAL_OPINION';

export interface SubmitFeedbackParams {
  category: FeedbackCategory;
  feedbackType: FeedbackType;
  content: string;
  // 신고 대상을 특정할 수 있는 화면(예: 특정 셔틀 노선, 특정 게시글)에서만 채워 넘김
  targetId?: string;
  appVersion?: string;
  // 연락처(선택) — 답변이 필요한 문의일 때만
  contact?: string;
}

export interface FeedbackApiRepository {
  // userId/platform은 호출부가 매번 몰라도 되게 레포지토리가 채워 넣는다 (기존 FeedbackRepository와 동일한 방식)
  submit: (params: SubmitFeedbackParams) => Promise<void>;
}
