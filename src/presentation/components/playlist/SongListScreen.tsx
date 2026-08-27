import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { type Song, filterSongsByGenre } from './playlistTypes';
import { SongPostCard } from './SongPostCard';
import { EmptyGenreState } from './EmptyGenreState';
import { GenreFilterChips } from './GenreFilterChips';

interface SongListScreenProps {
  title: string;
  emoji?: string;
  subtitle?: string;
  songs: Song[];
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
}

export function SongListScreen({ title, emoji, subtitle, songs, onBack, onPlay, onShowAddSong }: SongListScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const filteredSongs = filterSongsByGenre(songs, selectedGenre);

  return (
    <div className="-mx-4 px-4 pb-[calc(204px+env(safe-area-inset-bottom))]">
      {/* 고정 헤더 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader title={title} emoji={emoji} subtitle={subtitle} onBack={onBack} />
        <GenreFilterChips
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          variant="list"
          className="pb-3"
        />
      </div>
      {/* 곡 리스트 — 인스타그램 피드처럼 2열 카드 그리드 */}
      <div className="-mx-4 px-2">
        {filteredSongs.length === 0 ? (
          <EmptyGenreState onShowAddSong={onShowAddSong} boxed />
        ) : (
          <div className="grid grid-cols-2 gap-3 py-1">
            {filteredSongs.map((song) => (
              <SongPostCard key={song.trackId} post={song} onPlay={onPlay} className="w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
