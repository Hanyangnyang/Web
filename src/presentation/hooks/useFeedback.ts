// 훅(ViewModel): 피드백 작성·제출 상태 관리
import { useMutation } from '@tanstack/react-query';
import { submitFeedbackUseCase } from '../../di.js';

export interface UseFeedbackResult {
  loading: boolean;
  submitted: boolean;
  error: string | null;
  submit: (content: string) => Promise<void>;
  /** 제출 결과를 지운다 — 같은 화면에서 맥락이 바뀌어 다시 보낼 수 있어야 할 때 (예: 검색어 변경) */
  reset: () => void;
}

export function useFeedback(): UseFeedbackResult {
  const mutation = useMutation({
    mutationFn: (content: string) => submitFeedbackUseCase.execute(content),
  });

  return {
    loading: mutation.isPending,
    submitted: mutation.isSuccess,
    error: mutation.isError ? '피드백을 보내지 못했어요. 잠시 후 다시 시도해 주세요 🙏' : null,
    submit: async (content: string) => {
      await mutation.mutateAsync(content);
    },
    reset: mutation.reset,
  };
}
