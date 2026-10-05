// 훅: 인스타그램이 있는 동아리 중 하나를 골라 5초마다 다른 동아리로 로테이션 — 중앙동아리·소식탭 오늘의 추천 배너 공용
import { useEffect, useState } from 'react';
import { CLUBS, type ClubInfo } from '../../domain/entities/Club.js';

const ROTATE_INTERVAL_MS = 5000;

// 동아리 신입 모집이 몰리는 달(3월·9월)에만 소식탭 추천 배너를 노출한다.
const CLUB_BANNER_MONTHS = [3, 9];

// 기기 시간대와 무관하게 한국 시간 기준 월로 판단한다 (해외 체류·시간대 설정이 달라도 동일하게 동작).
export function isClubBannerSeason(now: Date = new Date()): boolean {
  const month = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'numeric' }).format(now));
  return CLUB_BANNER_MONTHS.includes(month);
}

export function useClubSpotlight(): ClubInfo {
  const [spotlightClub, setSpotlightClub] = useState<ClubInfo>(() => {
    const clubsWithInstagram = CLUBS.filter((club) => club.instagram);
    return clubsWithInstagram[Math.floor(Math.random() * clubsWithInstagram.length)];
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSpotlightClub((currentClub) => {
        const candidates = CLUBS.filter((club) => club.instagram && club.id !== currentClub.id);
        return candidates[Math.floor(Math.random() * candidates.length)];
      });
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return spotlightClub;
}
