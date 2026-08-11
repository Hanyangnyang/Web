// 훅: 선택된 칩 하나로부터 '지금 화면이 어떤 상태인가'를 파생시킨다.
//
// 칩 하나가 (1) 어떤 마커 레이어를 그릴지 (2) 어떤 시트를 띄울지 (3) 매장 필터가 뭔지를
// 동시에 결정하는데, 이 파생이 화면 컴포넌트에 boolean 7~8개로 흩어져 있었다.
// 규칙을 한곳에 모아 이름을 붙여두면 "왜 이때 이게 보이지?"를 여기만 보고 답할 수 있다.
// 이 훅은 칩에서만 파생된다(데이터에 의존하지 않는다) — 그래야 "무엇을 불러올지"를 먼저 정하고
// 그 결과로 RQ를 켤 수 있다. 받아온 건물을 걸러내는 일은 데이터가 도착한 뒤라 호출부가 맡는다.
import type { CategoryFilter } from '../../../domain/entities/PartnerStore.js';
import { toStoreCategory, type MapChip } from './useCampusMapFilters.js';

export function useCampusMapLayers(chip: MapChip | null) {
  // '전체'는 모든 레이어를 한꺼번에 보여주는 모드 — 대신 바텀시트는 띄우지 않는다
  const isAllChip = chip === 'all';
  const isOpenSpaceChip = chip === 'openspace';
  const isSmokingChip = chip === 'smoking';
  // 교내시설·오픈스페이스 둘 다 건물 데이터를 쓴다 (오픈스페이스는 그중 일부만 추린 것)
  const isBuildingLayerChip = chip === 'building' || isOpenSpaceChip;

  // 지도에 실제로 그릴 레이어 — 칩 '선택' 상태와는 별개다 ('전체'면 전부 그린다)
  const showsBuildingLayer = isAllChip || isBuildingLayerChip;
  const showsSmokingLayer = isAllChip || isSmokingChip;

  // 매장 카테고리 칩일 때만 매장 필터가 잡힌다 ('전체'는 'all'이 그대로 넘어와 전 카테고리)
  const storeCategory: CategoryFilter | null = toStoreCategory(chip);

  // 시트는 '전체'/미선택에선 안 뜬다 (플로팅 버튼 위치 계산에도 쓰인다)
  const sheetVisible = chip !== null && !isAllChip;

  return {
    isAllChip,
    isOpenSpaceChip,
    isSmokingChip,
    isBuildingLayerChip,
    showsBuildingLayer,
    showsSmokingLayer,
    storeCategory,
    sheetVisible,
  };
}
