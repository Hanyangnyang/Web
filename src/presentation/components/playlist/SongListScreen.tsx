import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { type Song, GENRES } from './playlistTypes';
import { RecentSongListRow } from './RecentSongListRow';
import { EmptyGenreState } from './EmptyGenreState';

interface SongListScreenProps {
  title: string;
  emoji?: string;
  subtitle?: string;
  songs: Song[];
  onBack: () => void;
  onPlay: (song: Song) => void;
  onRequireLogin: () => void;
  onShowAddSong: () => void;
}

export function SongListScreen({ title, emoji, subtitle, songs, onBack, onPlay, onRequireLogin, onShowAddSong }: SongListScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const selectedGenreLabel = GENRES.find((genre) => genre.key === selectedGenre)?.label;
  const filteredSongs = selectedGenre === 'all'
    ? songs
    : songs.filter((song) => song.genres.includes(selectedGenreLabel ?? ''));

  return (
    <div className="-mx-4 px-4 pb-[calc(204px+env(safe-area-inset-bottom))]">
      {/* 고정 헤더 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader title={title} emoji={emoji} subtitle={subtitle} onBack={onBack} />
        <div className="flex gap-2 overflow-x-auto pb-3 px-4 ml-[-1rem] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {GENRES.map((genre) => (
            <button
              key={genre.key}
              onClick={() => setSelectedGenre(genre.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
                selectedGenre === genre.key && genre.key !== 'all'
                  ? `${genre.active} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
                  : genre.key === 'all' && selectedGenre === 'all'
                    ? 'bg-slate-700 text-white border-transparent shadow-[0_2px_6px_rgba(51,65,85,0.25)]'
                    : genre.key === 'all'
                      ? 'bg-slate-200 text-slate-800 border-slate-400'
                      : `${genre.light} text-gray-800 border-transparent`
              }`}
            >
              {genre.emoji && <span className="text-base">{genre.emoji}</span>}
              <span>{genre.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* 곡 리스트 */}
      <div className="-mx-4 px-2">
        {filteredSongs.length === 0 ? (
          <EmptyGenreState onShowAddSong={onShowAddSong} boxed />
        ) : (
          <div className="flex flex-col gap-1 py-1">
            {filteredSongs.map((song) => (
              <RecentSongListRow key={song.trackId} song={song} onPlay={onPlay} onRequireLogin={onRequireLogin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
