// 훅: 새 백엔드 통합 피드백 제출(카테고리·유형 태깅) — 실제 화면 연동은 추후 진행
import { useMutation } from '@tanstack/react-query';
import { submitFeedbackApiUseCase } from '../../di.js';
import type { SubmitFeedbackParams } from '../../domain/repositories/IFeedbackApiRepository.js';

export function useSubmitFeedbackApi() {
  return useMutation({
    mutationKey: ['feedback-api', 'submit'], // Sentry에서 어느 뮤테이션이 실패했는지 구분하는 태그로 쓰임
    mutationFn: (params: SubmitFeedbackParams) => submitFeedbackApiUseCase.execute(params),
  });
}
