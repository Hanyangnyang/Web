// 훅(ViewModel): 피드백 작성·제출 상태 관리
import { useState } from 'react';
import { submitFeedbackUseCase } from '../../di.js';

export interface UseFeedbackResult {
  loading: boolean;
  submitted: boolean;
  submit: (content: string) => Promise<void>;
}

export function useFeedback(): UseFeedbackResult {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (content: string) => {
    setLoading(true);
    try {
      await submitFeedbackUseCase.execute(content);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return { loading, submitted, submit };
}
