// 유스케이스: 새 백엔드 통합 피드백 접수 (기존 SubmitFeedbackUseCase와 별개 — 새 백엔드용)
import type { FeedbackApiRepository, SubmitFeedbackParams } from '../repositories/IFeedbackApiRepository.js';

export interface SubmitFeedbackApiUseCase {
  execute: (params: SubmitFeedbackParams) => Promise<void>;
}

export const createSubmitFeedbackApiUseCase = (
  { feedbackApiRepository }: { feedbackApiRepository: FeedbackApiRepository }
): SubmitFeedbackApiUseCase => ({
  execute: (params) => feedbackApiRepository.submit(params),
});
