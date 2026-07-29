// 유스케이스: 인스타그램 계정의 프로필 정보 조회
import type { InstagramProfile } from '../entities/InstagramAccount.js';
import type { InstagramRepository } from '../../data/repositories/InstagramRepository.js';

export interface GetInstagramProfileUseCase {
  execute: (username: string) => Promise<InstagramProfile>;
}

export const createGetInstagramProfileUseCase = (
  { instagramRepository }: { instagramRepository: InstagramRepository }
): GetInstagramProfileUseCase => ({
  execute: (username) => instagramRepository.getProfile(username),
});
