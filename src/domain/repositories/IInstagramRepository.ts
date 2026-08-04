// 도메인 레포지토리 인터페이스: 인스타그램 프로필 제공 계약 (구현은 data 레이어의 InstagramRepository)
import type { InstagramProfile } from '../entities/InstagramAccount.js';

export interface InstagramRepository {
  getProfile: (username: string) => Promise<InstagramProfile>;
  getProxiedImageUrl: (originalUrl: string) => string;
}
