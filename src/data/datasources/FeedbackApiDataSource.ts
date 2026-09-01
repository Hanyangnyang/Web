// 데이터 소스: 새 백엔드 통합 피드백 접수(/api/v1/feedbacks) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export type FeedbackCategoryDto =
  | 'SHUTTLE' | 'CITY_BUS' | 'SUBWAY' | 'CAMPUS_MAP' | 'MENU' | 'GYM'
  | 'LIBRARY' | 'PLAYLIST' | 'WEATHER' | 'PARTNERSHIP' | 'BANNER' | 'GENERAL';

export type FeedbackTypeDto = 'BUG_REPORT' | 'INACCURACY' | 'FEATURE_REQUEST' | 'INQUIRY' | 'GENERAL_OPINION';

export type FeedbackStatusDto = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface CreateFeedbackDto {
  userId: string;
  category: FeedbackCategoryDto;
  feedbackType: FeedbackTypeDto;
  content: string;
  targetId?: string;
  platform?: string;
  appVersion?: string;
  contact?: string;
}

// 응답 전체(status/adminMemo 등 관리자용 필드 포함) — 지금은 접수 성공 여부만 필요해서
// 레포지토리에서 성공 여부만 확인하고 나머지는 그대로 버림
export interface FeedbackDto {
  id: string;
  userId: string;
  category: FeedbackCategoryDto;
  feedbackType: FeedbackTypeDto;
  content: string;
  targetId: string;
  platform: string;
  appVersion: string;
  contact: string;
  status: FeedbackStatusDto;
  adminMemo: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackApiDataSource {
  submit: (body: CreateFeedbackDto) => Promise<ApiResponse<FeedbackDto>>;
}

export const createFeedbackApiDataSource = ({ httpClient }: { httpClient: HttpClient }): FeedbackApiDataSource => ({
  submit: async (body) => parseOrThrow(await httpClient.post('/api/v1/feedbacks', body)),
});
