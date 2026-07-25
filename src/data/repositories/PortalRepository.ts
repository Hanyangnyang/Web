// 레포지토리: 소식탭 API 응답을 Weather/LibraryRoom 엔티티로 변환
import { createWeather, type Weather } from '../../domain/entities/Weather.js';
import { createLibraryRoom, type LibraryRoom } from '../../domain/entities/LibraryRoom.js';
import type { PortalApiDataSource } from '../datasources/PortalApiDataSource.js';

const LIBRARY_SORT_ORDER = [61, 63, 132, 131];

export interface LibraryStatus {
  list: LibraryRoom[];
  updatedAt: number;
}

export interface PortalRepository {
  getWeather: () => Promise<Weather>;
  getLibrary: () => Promise<LibraryStatus>;
}

export const createPortalRepository = (
  { portalApiDataSource }: { portalApiDataSource: PortalApiDataSource }
): PortalRepository => ({
  getWeather: async () => {
    const data = await portalApiDataSource.getWeather();
    return createWeather(data);
  },

  getLibrary: async () => {
    const data = await portalApiDataSource.getLibrary();
    if (!data.success) throw new Error('library API returned success:false');

    const list = data.data.list
      .map(room => createLibraryRoom({
        id: room.id,
        name: room.name,
        total: room.seats.total,
        occupied: room.seats.occupied,
      }))
      .sort((a, b) => LIBRARY_SORT_ORDER.indexOf(a.id) - LIBRARY_SORT_ORDER.indexOf(b.id));

    return { list, updatedAt: Date.now() };
  },
});
