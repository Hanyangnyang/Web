import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRACK_PROMO_CACHE_KEY, TrackPromoCarousel } from './TrackPromoCarousel.js';
import { type Song } from '../playlistTypes.js';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';

const recentSong: Song = {
  id: 'post-1',
  trackId: 'recent-1',
  title: '최근 노래',
  artist: '최근 가수',
  albumArtUrl: 'https://example.com/recent.jpg',
  comment: '좋아요',
  genres: ['인디'],
  createdAt: '2026-10-10T00:00:00Z',
};

const secondRecentSong: Song = {
  ...recentSong,
  id: 'post-2',
  trackId: 'recent-2',
  title: '두 번째 최근 노래',
};

const thirdRecentSong: Song = {
  ...recentSong,
  id: 'post-3',
  trackId: 'recent-3',
  title: '세 번째 최근 노래',
};

const popularTrack: ChartTrack = {
  rank: 3,
  trackId: 'popular-1',
  title: '실시간 노래',
  artist: '실시간 가수',
  albumArtUrl: 'https://example.com/popular.jpg',
  isLiked: false,
};

const weeklyTrack: ChartTrack = {
  rank: 7,
  trackId: 'weekly-1',
  title: '주간 노래',
  artist: '주간 가수',
  albumArtUrl: 'https://example.com/weekly.jpg',
  isLiked: false,
};

describe('TrackPromoCarousel', () => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  });

  beforeEach(() => {
    storage.clear();
    localStorage.removeItem(TRACK_PROMO_CACHE_KEY);
    vi.restoreAllMocks();
  });

  it('최근 곡과 실시간·주간 차트 곡을 각각 알맞은 문구로 보여준다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(
      <TrackPromoCarousel
        recentSongs={[recentSong, secondRecentSong]}
        popularTracks={[popularTrack]}
        weeklyTracks={[weeklyTrack]}
        onSelectRecent={vi.fn()}
        onSelectChart={vi.fn()}
      />,
    );

    expect(screen.getAllByText('누군가 추천했어요').length).toBeGreaterThan(0);
    expect(screen.getByText('혹시, 이 노래 알아요?')).toBeTruthy();
    expect(screen.getByText('지금 인기 있는 음악이에요')).toBeTruthy();
    expect(screen.getByText('이번 주 인기차트에 올랐어요')).toBeTruthy();
    expect(screen.getByText('실시간 노래')).toBeTruthy();
    expect(screen.getByText('주간 가수')).toBeTruthy();
    expect(screen.queryByText('TOP 3')).toBeNull();
    expect(screen.queryByText('LIVE CHART')).toBeNull();
    expect(screen.getAllByRole('button', { name: /번째 배너로 이동/ })).toHaveLength(4);
  });

  it('배너 출처에 맞는 곡과 차트 기간을 전달한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const onSelectRecent = vi.fn();
    const onSelectChart = vi.fn();
    render(
      <TrackPromoCarousel
        recentSongs={[recentSong, secondRecentSong]}
        popularTracks={[popularTrack]}
        weeklyTracks={[weeklyTrack]}
        onSelectRecent={onSelectRecent}
        onSelectChart={onSelectChart}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: '최근 노래 - 최근 가수 보러 가기' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '실시간 노래 - 실시간 가수 보러 가기' }));
    fireEvent.click(screen.getByRole('button', { name: '주간 노래 - 주간 가수 보러 가기' }));

    expect(onSelectRecent).toHaveBeenCalledWith(recentSong);
    expect(onSelectChart).toHaveBeenNthCalledWith(1, popularTrack, 'popular');
    expect(onSelectChart).toHaveBeenNthCalledWith(2, weeklyTrack, 'weekly');
  });

  it('서로 다른 최근 곡 두 개를 선택하고 새로고침에 해당하는 재마운트에도 10분간 유지한다', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const props = {
      recentSongs: [recentSong, secondRecentSong, thirdRecentSong],
      popularTracks: [popularTrack],
      weeklyTracks: [weeklyTrack],
      onSelectRecent: vi.fn(),
      onSelectChart: vi.fn(),
    };
    const firstRender = render(<TrackPromoCarousel {...props} />);

    expect(screen.getAllByText('최근 노래').length).toBeGreaterThan(0);
    expect(screen.getByText('두 번째 최근 노래')).toBeTruthy();
    expect(screen.queryByText('세 번째 최근 노래')).toBeNull();
    firstRender.unmount();

    random.mockReturnValue(0.99);
    render(<TrackPromoCarousel {...props} />);

    expect(screen.getAllByText('최근 노래').length).toBeGreaterThan(0);
    expect(screen.getByText('두 번째 최근 노래')).toBeTruthy();
    expect(screen.queryByText('세 번째 최근 노래')).toBeNull();
  });

  it('차트에 다른 후보가 있으면 앞선 배너와 같은 곡을 피한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const duplicatedPopular = { ...popularTrack, trackId: recentSong.trackId, title: '겹치는 실시간 노래' };
    const uniquePopular = { ...popularTrack, trackId: 'popular-unique', title: '고유 실시간 노래' };
    const duplicatedWeekly = { ...weeklyTrack, trackId: uniquePopular.trackId, title: '겹치는 주간 노래' };
    const uniqueWeekly = { ...weeklyTrack, trackId: 'weekly-unique', title: '고유 주간 노래' };

    render(
      <TrackPromoCarousel
        recentSongs={[recentSong, secondRecentSong]}
        popularTracks={[duplicatedPopular, uniquePopular]}
        weeklyTracks={[duplicatedWeekly, uniqueWeekly]}
        onSelectRecent={vi.fn()}
        onSelectChart={vi.fn()}
      />,
    );

    expect(screen.getByText('고유 실시간 노래')).toBeTruthy();
    expect(screen.getByText('고유 주간 노래')).toBeTruthy();
    expect(screen.queryByText('겹치는 실시간 노래')).toBeNull();
    expect(screen.queryByText('겹치는 주간 노래')).toBeNull();
  });

  it('차트 후보가 모두 겹칠 때만 같은 곡을 허용한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const duplicatedPopular = { ...popularTrack, trackId: recentSong.trackId, title: recentSong.title, artist: recentSong.artist };
    const duplicatedWeekly = { ...weeklyTrack, trackId: recentSong.trackId, title: recentSong.title, artist: recentSong.artist };

    render(
      <TrackPromoCarousel
        recentSongs={[recentSong]}
        popularTracks={[duplicatedPopular]}
        weeklyTracks={[duplicatedWeekly]}
        onSelectRecent={vi.fn()}
        onSelectChart={vi.fn()}
      />,
    );

    expect(screen.getByText('지금 인기 있는 음악이에요')).toBeTruthy();
    expect(screen.getByText('이번 주 인기차트에 올랐어요')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /최근 노래 - 최근 가수 보러 가기/ }).length).toBeGreaterThanOrEqual(3);
  });
});
