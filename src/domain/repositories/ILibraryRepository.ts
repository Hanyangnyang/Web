// 도메인 레포지토리 인터페이스: 도서관 열람실 혼잡도 제공 계약 (구현은 data 레이어의 LibraryRepository)
import type { LibraryRoom } from '../entities/LibraryRoom.js';

export interface LibraryStatus {
  list: LibraryRoom[];
  updatedAt: string; 
}

export interface LibraryRepository {
  getStatus: () => Promise<LibraryStatus>;
}
