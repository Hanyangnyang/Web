// 유스케이스: 소식탭 도서관 열람실 혼잡도 조회
import type { LibraryStatus, PortalRepository } from '../../data/repositories/PortalRepository.js';

export interface GetLibraryStatusUseCase {
  execute: () => Promise<LibraryStatus>;
}

export const createGetLibraryStatusUseCase = (
  { portalRepository }: { portalRepository: PortalRepository }
): GetLibraryStatusUseCase => ({
  execute: () => portalRepository.getLibrary(),
});
