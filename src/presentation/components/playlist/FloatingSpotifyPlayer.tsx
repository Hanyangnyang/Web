import { X } from 'lucide-react';

interface Song {
  trackId: string;
  title: string;
  artist: string;
}

interface FloatingSpotifyPlayerProps {
  song: Song | null;
  onClose: () => void;
}

export function FloatingSpotifyPlayer({ song, onClose }: FloatingSpotifyPlayerProps) {
  if (!song) return null;

  const embedUrl = `https://open.spotify.com/embed/track/${song.trackId}`;

  return (
    <div className="fixed bottom-20 left-0 right-0 w-full bg-white shadow-2xl border-t border-slate-200 z-40 animate-slideUp">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text-main truncate text-sm">{song.title}</div>
          <div className="text-xs text-text-sub truncate">{song.artist}</div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors active:scale-95"
        >
          <X size={18} className="text-text-sub" />
        </button>
      </div>

      {/* Spotify Embed */}
      <div className="px-4 py-3 bg-slate-50">
        <iframe
          src={`${embedUrl}?utm_source=generator`}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded"
        />
      </div>
    </div>
  );
}
