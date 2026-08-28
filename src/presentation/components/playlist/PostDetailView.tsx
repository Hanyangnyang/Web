import { Smile } from 'lucide-react';
import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { GENRES } from './playlistTypes';

interface PostDetailViewProps {
  onBack: () => void;
}

const EMOJI_OPTIONS = ['😍', '😂', '😮', '😢', '👍', '🔥', '💯', '🥹'];

// UI 디자인용 임시 더미 — 실제로는 클릭해서 들어온 게시글 데이터로 교체될 예정
const DUMMY_POST = {
  albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
  title: 'Busy Boy',
  artist: '주혜린',
  body: '이 노래 진짜 좋아! 베이스 라인이 미쳤어, 이런 감성의 R&B는 진짜 오랜만이에요 ㅠㅠ 요즘 계속 듣는 중인데 질리지가 않아요.',
  genre: 'R&B',
};

// UI 디자인용 임시 더미 — 다른 사용자들이 이미 남긴 이모지별 반응 수
const DUMMY_REACTION_COUNTS: Record<string, number> = {
  '😍': 3,
  '👍': 5,
  '🔥': 1,
};

// 게시글 조회(단건) 화면 — 헤더는 항상 홈과 동일. 데이터는 아직 더미, 이모지 리액션(다중 선택)만 실제 동작
export function PostDetailView({ onBack }: PostDetailViewProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const genre = GENRES.find((g) => g.label === DUMMY_POST.genre);

  const toggleReaction = (emoji: string) => {
    setMyReactions((prev) => {
      const next = new Set(prev);
      if (next.has(emoji)) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
  };

  // 다른 사용자 반응 수 + 내 반응 여부를 합쳐서 0보다 큰 이모지만 표시
  const displayedEmojis = EMOJI_OPTIONS.filter(
    (emoji) => (DUMMY_REACTION_COUNTS[emoji] ?? 0) + (myReactions.has(emoji) ? 1 : 0) > 0
  );

  return (
    <div className="pb-[calc(204px+env(safe-area-inset-bottom))]">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들에게 곡을 추천해주세요!"
        onBack={onBack}
      />

      {/* 인스타그램 게시물처럼 앨범커버와 하단 콘텐츠가 하나의 카드로 이어지는 형태 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* 앨범 커버 */}
        <img
          src={DUMMY_POST.albumArtUrl}
          alt={DUMMY_POST.title}
          className="w-full aspect-square object-cover bg-slate-100"
        />

        <div className="px-4 pt-3 pb-4">
          {/* 이모지 리액션 — 여러 개 선택 가능, 이모지 옆 숫자는 다른 사용자를 포함한 총 반응 수 */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {/* 이모지 추가 버튼 */}
            <div className="relative inline-block">
              <button
                onClick={() => setPickerOpen((prev) => !prev)}
                aria-label="이모지 추가"
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Smile size={16} className="text-text-sub" strokeWidth={2} />
              </button>

              {pickerOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-10">
                  <div className="flex gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          toggleReaction(emoji);
                          setPickerOpen(false);
                        }}
                        aria-label={`${emoji} 남기기`}
                        className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-slate-100 active:scale-90 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {/* 말풍선 꼬리 */}
                  <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45 ml-3 -mt-1.5" />
                </div>
              )}
            </div>

            {displayedEmojis.map((emoji) => {
              const count = (DUMMY_REACTION_COUNTS[emoji] ?? 0) + (myReactions.has(emoji) ? 1 : 0);
              const mine = myReactions.has(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  aria-label={`${emoji} 반응 ${mine ? '취소' : '남기기'}`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                    mine ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-100 border-transparent text-text-sub'
                  }`}
                >
                  <span className="text-sm">{emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>

          {/* 제목 · 가수명 */}
          <div className="mb-2 truncate">
            <span className="text-base font-bold text-text-main">{DUMMY_POST.title}</span>
            <span className="text-sm font-medium text-text-sub"> · {DUMMY_POST.artist}</span>
          </div>

          {/* 본문 */}
          <p className="text-sm text-text-main leading-relaxed mb-3 whitespace-pre-line">{DUMMY_POST.body}</p>

          {/* 장르 */}
          <div className="flex items-center gap-1 text-xs font-medium text-text-sub">
            {genre?.emoji && <span>{genre.emoji}</span>}
            <span>{DUMMY_POST.genre}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
