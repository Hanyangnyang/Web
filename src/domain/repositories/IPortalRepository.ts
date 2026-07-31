// 도메인 레포지토리 인터페이스: 소식탭 날씨·도서관 정보 제공 계약 (구현은 data 레이어의 PortalRepository)
import type { Weather } from '../entities/Weather.js';
import type { LibraryRoom } from '../entities/LibraryRoom.js';

export interface LibraryStatus {
  list: LibraryRoom[];
  updatedAt: number;
}

export interface PortalRepository {
  getWeather: () => Promise<Weather>;
  getLibrary: () => Promise<LibraryStatus>;
}
