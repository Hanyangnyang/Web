// 도메인 레포지토리 인터페이스: 피드백 제출 계약 (구현은 data 레이어의 FeedbackRepository)
export interface FeedbackRepository {
  submit: (content: string) => Promise<void>;
}
