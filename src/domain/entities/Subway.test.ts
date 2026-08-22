import { describe, it, expect } from 'vitest';
import { connectingTrains } from './Subway.js';

describe('connectingTrains', () => {
  const subwayArrivals = [
    { subwayId: '1004', updnLine: '상행', arrTime: '08:10' },
    { subwayId: '1004', updnLine: '상행', arrTime: '08:20' },
    { subwayId: '1004', updnLine: '상행', arrTime: '08:30' },
    { subwayId: '1004', updnLine: '하행', arrTime: '08:12' },
    { subwayId: '1075', updnLine: '상행', arrTime: '08:15' },
  ];

  it('같은 노선(subwayId)·같은 방향(updnLine)이면서 셔틀 도착 이후인 열차만, 최대 2개까지 반환한다', () => {
    const result = connectingTrains(subwayArrivals, '08:05', 'line4-bulam');
    expect(result.map(t => t.arrTime)).toEqual(['08:10', '08:20']); // 3개 중 앞 2개만
  });

  it('셔틀 도착 시각 이전 열차는 연결 대상에서 제외한다', () => {
    const result = connectingTrains(subwayArrivals, '08:25', 'line4-bulam');
    expect(result.map(t => t.arrTime)).toEqual(['08:30']);
  });

  it('존재하지 않는 lineId면 빈 배열을 반환한다', () => {
    expect(connectingTrains(subwayArrivals, '08:00', 'no-such-line')).toEqual([]);
  });

  it('도착정보가 없으면 빈 배열을 반환한다', () => {
    expect(connectingTrains([], '08:00', 'line4-bulam')).toEqual([]);
  });
});
