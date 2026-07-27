// 레포지토리: 일반버스 API 원시 응답을 정류소별 정규화 도착정보로 변환
import { ALLOWED_BUSES_BY_STOP, STATION_IDS, type BusArrival } from '../../domain/entities/PublicBus.js';
import type { BusApiDataSource, BusArrivalListItem } from '../datasources/BusApiDataSource.js';

export interface BusRepository {
  getArrivals: (stopName: string) => Promise<BusArrival[]>;
}

const CROWD_LABELS: Record<string, string> = { '1': '여유', '2': '보통', '3': '혼잡' };

function toArrival(
  routeName: string,
  time: string | number | undefined,
  location: string | number | undefined,
  seatCount: string | number | undefined,
  crowded: string | number | undefined,
  dest: string,
  runIndex: number,
): BusArrival | null {
  if (time === undefined || time === null || time === '') return null;
  const apiMinutes = parseInt(String(time), 10);
  if (isNaN(apiMinutes)) return null;

  let seatInfo = '';
  if (seatCount !== undefined && seatCount !== -1 && seatCount !== '') {
    const seatNum = parseInt(String(seatCount), 10);
    if (!isNaN(seatNum) && seatNum > 0) seatInfo = `·${seatNum}석`;
  }

  let crowdedInfo = '';
  if (!seatInfo && crowded) {
    const label = CROWD_LABELS[String(crowded)];
    if (label) crowdedInfo = `·${label}`;
  }

  const locVal = parseInt(String(location), 10);
  const locStr = !isNaN(locVal) ? `${locVal}번째전` : '';

  return {
    busId: routeName,
    runIndex,
    apiMinutes,
    info: `${locStr}${seatInfo || crowdedInfo}`,
    direction: `${dest} 방면`,
  };
}

export const createBusRepository = ({ busApiDataSource }: { busApiDataSource: BusApiDataSource }): BusRepository => ({
  getArrivals: async (stopName: string) => {
    const stationId = STATION_IDS[stopName];
    if (!stationId) return [];

    const data = await busApiDataSource.getArrivals(stationId);
    let list = data.response?.msgBody?.busArrivalList ?? [];
    if (!Array.isArray(list)) list = [list];

    const allowed = ALLOWED_BUSES_BY_STOP[stopName] || [];
    const parsed: BusArrival[] = [];

    (list as BusArrivalListItem[]).forEach(item => {
      const routeName = String(item.routeName);
      if (!allowed.includes(routeName)) return;

      const first = toArrival(routeName, item.predictTime1, item.locationNo1, item.remainSeatCnt1, item.crowded1, item.routeDestName, 0);
      const second = toArrival(routeName, item.predictTime2, item.locationNo2, item.remainSeatCnt2, item.crowded2, item.routeDestName, 1);
      if (first) parsed.push(first);
      if (second) parsed.push(second);
    });

    return parsed;
  },
});
