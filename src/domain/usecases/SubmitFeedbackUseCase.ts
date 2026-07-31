// 유스케이스: 사용자 피드백 제출
import type { FeedbackRepository } from '../repositories/IFeedbackRepository.js';

export interface SubmitFeedbackUseCase {
  execute: (content: string) => Promise<void>;
}

export const createSubmitFeedbackUseCase = (
  { feedbackRepository }: { feedbackRepository: FeedbackRepository }
): SubmitFeedbackUseCase => ({
  execute: (content) => feedbackRepository.submit(content),
});
