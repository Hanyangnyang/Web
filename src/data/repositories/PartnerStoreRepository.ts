// 레포지토리: 제휴 매장 API 응답(DTO)을 도메인 엔티티로 변환해 제공
import { apiError, withAreaTag } from '../../infrastructure/http/HttpClient.js';
import {
  CATEGORY_ORDER, type PartnerStore, type Partnership, type StoreCategory,
} from '../../domain/entities/PartnerStore.js';
import { normalizeCoordinates } from '../../domain/entities/Coordinates.js';
import { collegeByName } from '../../domain/entities/College.js';
import { getKSTDateKey } from '../../utils/kstTime.js';
import type { PartnerStoreRepository } from '../../domain/repositories/IPartnerStoreRepository.js';
import type {
  PartnerStoreApiDataSource, PartnerStoreDto, PartnershipDto,
} from '../datasources/PartnerStoreApiDataSource.js';

// Sentry 태그용 — 이 레포지토리가 던지는 검증 에러에 공통으로 붙는 한글 이름표 (다른 /api/v1/* 레포지토리들과 동일한 apiError 패턴)
const AREA = '제휴매장';

// API가 활성 여부를 안 주고 startDate/endDate만 주므로, KST 기준 오늘이 그 구간 안에 있는지로 직접 판정한다
function isWithinPeriod(startDate: string, endDate: string): boolean {
  const today = getKSTDateKey();
  return startDate <= today && today <= endDate;
}

// merchangCategory가 없을 경우 해당 매장을 제외시키는 검증 로직  
function isStoreCategory(value: unknown): value is StoreCategory {
  return typeof value === 'string' && (CATEGORY_ORDER as readonly string[]).includes(value);
}

// department·startDate·endDate처럼 화면 표시나 isActive 계산에 꼭 필요한 필드가 비어 있으면
// 그 제휴 하나만 건너뛴다 — 매장 전체를 못 뜨게 하고 싶지 않아서
function toPartnership(raw: PartnershipDto): Partnership | null {
  if (typeof raw.department !== 'string' || !raw.department) return null;
  if (typeof raw.startDate !== 'string' || typeof raw.endDate !== 'string') return null;

  return {
    partnershipId: raw.partnershipId,
    collegeId: collegeByName(raw.department)?.id ?? '',
    collegeName: raw.department,
    benefit: raw.benefit ?? null,
    period: {
      startDate: raw.startDate,
      endDate: raw.endDate,
      isActive: isWithinPeriod(raw.startDate, raw.endDate),
    },
    conditions: raw.conditions ?? null,
    sourceUrl: raw.sourceUrl ?? null,
    photoOrder: raw.photoOrder ?? null,
  };
}

// id·이름·카테고리 중 하나라도 신뢰할 수 없으면 매장 전체를 건너뛴다 —
// 잘못된 카테고리로 잘못 표시하는 것보다, 그 매장 하나가 안 보이는 게 안전하다
function toPartnerStore(raw: PartnerStoreDto): PartnerStore | null {
  if (raw.merchantId == null) return null;
  if (typeof raw.storeName !== 'string' || !raw.storeName) return null;
  if (!isStoreCategory(raw.merchantCategory)) return null;

  const partnerships = (raw.partnerships ?? [])
    .map(toPartnership)
    .filter((p): p is Partnership => p !== null);
  const firstActiveBenefit = partnerships.find((p) => p.period?.isActive)?.benefit ?? null;

  return {
    id: String(raw.merchantId),
    name: raw.storeName,
    category: raw.merchantCategory,
    isActive: raw.isActive,
    emoji: raw.emoji,
    summaryBenefit: firstActiveBenefit,
    location: {
      coordinates: normalizeCoordinates({ latitude: raw.latitude, longitude: raw.longitude }),
      address: null,
      fullAddress: raw.fullAddress,
    },
    kakaoPlaceId: raw.kakaoPlaceId ?? null,
    partnerships,
  };
}

export const createPartnerStoreRepository = ({ partnerStoreApiDataSource }: { partnerStoreApiDataSource: PartnerStoreApiDataSource }): PartnerStoreRepository => ({
    getPartnerStores: () => withAreaTag(AREA, async () => {
      const res = await partnerStoreApiDataSource.getPartnerStores();
      if (!res.success)
        throw apiError(res.error?.message || 'partnerships API returned success:false', { area: AREA, endpoint: res._requestUrl });
      if (!Array.isArray(res.data))
        throw apiError('partnerships API returned invalid shape', { area: AREA, endpoint: res._requestUrl });

      return res.data
        .map((raw) => {
          // 위 검증을 뚫고 들어온 예상 못 한 예외(예: 정규화 로직 내부 문제)까지 대비하는 최후 안전망 —
          // 매장 하나가 이상하다고 나머지 전부가 안 뜨는 상황(all-or-nothing)을 막는다
          try {
            return toPartnerStore(raw);
          } catch (e) {
            console.warn('[PartnerStoreRepository] 매장 매핑 실패, 건너뜀', raw, e);
            return null;
          }
        })
        .filter((store): store is PartnerStore => store !== null);
    }),
});
