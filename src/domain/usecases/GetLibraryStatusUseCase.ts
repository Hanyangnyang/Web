// 유스케이스: 소식탭 도서관 열람실 혼잡도 조회
import type { LibraryStatus, LibraryRepository } from '../repositories/ILibraryRepository.js';

export interface GetLibraryStatusUseCase {
  execute: () => Promise<LibraryStatus>;
}

export const createGetLibraryStatusUseCase = (
  { libraryRepository }: { libraryRepository: LibraryRepository }
): GetLibraryStatusUseCase => ({
  execute: () => libraryRepository.getStatus(),
});
