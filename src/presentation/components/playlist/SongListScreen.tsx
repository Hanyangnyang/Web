import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { getGenreColor, getGenreActiveColor } from './playlistTheme';
import { type Song, GENRES } from './playlistTypes';
import { RecentSongListRow } from './RecentSongListRow';

interface SongListScreenProps {
  title: string;
  emoji?: string;
  subtitle?: string;
  songs: Song[];
  onBack: () => void;
  onPlay: (song: Song) => void;
  onRequireLogin: () => void;
}

// "최근 추가된 곡"/"좋아요 누른곡" 등, 세로 리스트 화면들이 공유하는 껍데기
// (스크롤 시 딱 붙는 헤더 + 장르칩 + 곡 리스트). 헤더 텍스트만 화면마다 다르게 받는다.
export function SongListScreen({ title, emoji, subtitle, songs, onBack, onPlay, onRequireLogin }: SongListScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState('all');

  return (
    <div className="pb-24">
      {/* 고정 헤더 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader title={title} emoji={emoji} subtitle={subtitle} onBack={onBack} />
        <div className="flex gap-2 overflow-x-auto pb-3 px-2 ml-[-1rem] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {GENRES.map((genre) => (
            <button
              key={genre.key}
              onClick={() => setSelectedGenre(genre.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
                selectedGenre === genre.key && genre.key !== 'all'
                  ? `${getGenreActiveColor(genre.colorIndex)} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
                  : genre.key === 'all' && selectedGenre === 'all'
                    ? 'bg-blue-200 text-blue-900 border-blue-300 shadow-[0_2px_6px_rgba(191,219,254,0.3)]'
                    : genre.key === 'all'
                      ? 'bg-slate-200 text-slate-800 border-slate-400'
                      : `${getGenreColor(genre.colorIndex)} text-gray-800 border-transparent`
              }`}
            >
              {genre.emoji && <span className="text-base">{genre.emoji}</span>}
              <span>{genre.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 곡 리스트 */}
      <div>
        {songs.map((song, index) => (
          <div key={song.trackId}>
            {index > 0 && <div className="border-t border-slate-200" />}
            <RecentSongListRow song={song} onPlay={onPlay} onRequireLogin={onRequireLogin} />
          </div>
        ))}
      </div>
    </div>
  );
}
