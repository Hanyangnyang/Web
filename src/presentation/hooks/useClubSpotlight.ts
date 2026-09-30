// 훅: 인스타그램이 있는 동아리 중 하나를 골라 5초마다 다른 동아리로 로테이션 — 중앙동아리·소식탭 오늘의 추천 배너 공용
import { useEffect, useState } from 'react';
import { CLUBS, type ClubInfo } from '../../domain/entities/Club.js';

const ROTATE_INTERVAL_MS = 5000;

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
