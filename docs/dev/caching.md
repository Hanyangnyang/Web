# 캐싱 구현

데이터 페칭·캐싱을 **어떻게** 구현했는지 적습니다. 데이터별로 얼마나 최신이어야 하는지(기획 기준)는 private 레포 `Hanyangnyang/Context`의 `context/tech/data-freshness.md`에 있습니다.

## 관련 코드
- `src/lib/queryClient.ts` — TanStack Query 클라이언트
- `src/presentation/hooks/createStaticDataQuery.ts` — 정적 데이터 쿼리 팩토리
- `src/infrastructure/storage/` — 로컬 저장소

## 데이터별 정책
| 데이터 | staleTime / 폴링 주기 | 로컬 저장 | 백엔드 캐시 | 비고 |
|---|---|---|---|---|
| 학식 메뉴 |  |  |  |  |
| 날씨·미세먼지 |  |  |  |  |
| 도서관 좌석 현황 |  |  |  |  |
| 셔틀·지하철 시간표 |  |  |  |  |
| 공공버스 도착정보 |  |  |  |  |
| 배너 |  |  |  |  |
