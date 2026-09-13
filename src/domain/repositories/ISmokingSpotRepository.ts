// 도메인 레포지토리 인터페이스: 흡연 부스/구역 목록 제공 (구현은 data 레이어의 SmokingSpotRepository)
import type { SmokingSpot } from '../entities/SmokingSpot.js';

export interface SmokingSpotRepository {
    getSmokingSpots: () => Promise<SmokingSpot[]>;
}
