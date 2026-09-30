// 도메인 엔티티: 2026학년도 1학기 ERICA 중앙동아리 모집 정보
// 실제 데이터는 ./clubs.json에서 관리 (백엔드 API 없이 손으로 갱신하는 데이터라 JSON으로 분리)
import clubsData from './clubs.json';

export type ClubCategory = '예술' | '체육' | '학술교양' | '봉사' | '종교';

export interface ClubFeeEntry {
  label: string | null;
  amount: string;
}

export interface ClubInfo {
  id: string;
  name: string;
  category: ClubCategory;
  activityType: string;
  room: string | null;
  instagram: string | null;
  aliases: string[];
  description: string;
  fees: ClubFeeEntry[];
  feeNote: string | null;
  recruitmentPeriod: null;
  activityDays: null;
  openingMeeting: null;
}

export const CLUBS: ClubInfo[] = clubsData as ClubInfo[];

export const CLUB_CATEGORIES: ClubCategory[] = ['예술', '체육', '학술교양', '봉사', '종교'];
