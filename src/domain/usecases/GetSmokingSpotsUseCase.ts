// 유스케이스: 흡연 부스/구역 목록 조회
import type { SmokingSpot } from "../entities/SmokingSpot.js";
import type { SmokingSpotRepository } from "../repositories/ISmokingSpotRepository.js";

export interface GetSmokingSpotsUseCase {
    execute: () => Promise<SmokingSpot[]>;
}

export const createGetSmokingSpotsUseCase = (
    { smokingSpotRepository }: { smokingSpotRepository: SmokingSpotRepository }
): GetSmokingSpotsUseCase => ({
    execute: () => smokingSpotRepository.getSmokingSpots(),
});
