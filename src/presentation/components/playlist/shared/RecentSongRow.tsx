import { ChevronRight, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { type Song, type ReactionState, toReactionState, formatTimeAgo } from '../playlistTypes';
import { EmptyCommentNote } from './EmptyCommentNote';
import { EmojiReactionBar } from './EmojiReactionBar';
import { type ReactionKey } from '../postReactions';
import { usePostInteractionMutations, nextOptimisticReaction } from '../../../hooks/playlist/usePostInteractions.js';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';

interface RecentSongRowProps {
  song: Song;
  // control: 앨범커버 이외의 나머지 영역(곡 정보 + 화살표) 클릭 — 최근 추가된 곡 전체보기로 이동해서 이 곡으로 스크롤
  // test: 화살표만 클릭했을 때 이동
  onSelect: (song: Song) => void;
  // control: 앨범커버 클릭 — 바로 재생 / test: 앨범커버 + 곡 정보 영역 클릭 — 바로 재생
  onPlay: (song: Song) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 앨범커버의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정 — docs/playlist-recent-songs-ab-test.md 참고. 안 넘기면 기존(control) 동작
  variant?: RecentSongsTapAreaVariant;
}

// 최근 추가된 곡 홈 미리보기 행.
// control: 앨범커버만 누르면 바로 재생되고, 그 외 나머지 영역(곡 정보 + 화살표)을 누르면 전체보기로 이동
// test: 앨범커버 + 곡 정보 영역을 누르면 바로 재생되고, 화살표만 눌러야 전체보기로 이동
export function RecentSongRow({ song, onSelect, onPlay, currentTrackId, variant = 'control' }: RecentSongRowProps) {
  // 반응 남기기/취소 — PostDetailCard와 같은 방식(낙관적 업데이트 → 서버 응답으로 맞춤, 실패 시 되돌림, 처리 중 연타 무시)
  const [reactions, setReactions] = useState<ReactionState>(() => toReactionState(song.reactions));
  const [pickerOpen, setPickerOpen] = useState(false);
  const { toggleReactionMutation } = usePostInteractionMutations();
  const toggleReaction = (key: ReactionKey) => {
    if (toggleReactionMutation.isPending) return;
    const previous = reactions;
    setReactions((prev) => nextOptimisticReaction(prev, key));
    if (!song.id) return;
    toggleReactionMutation.mutate(
      { songId: song.id, reactionType: key },
      {
        onSuccess: (updatedReactions) => setReactions(toReactionState(updatedReactions)),
        onError: () => setReactions(previous),
      }
    );
  };
  const isPlaying = song.trackId === currentTrackId;
  const isTest = variant === 'test';

  // test에서만 씀 — 재생 영역(커버+정보)을 누르는 동안 행 전체에 같은 눌림 피드백을 줘서 좌우가 별도 칸처럼 보이는 걸 막음
  const [isPlaybackPressed, setIsPlaybackPressed] = useState(false);
  const playbackPressHandlers = isTest
    ? {
        onPointerDown: () => setIsPlaybackPressed(true),
        onPointerUp: () => setIsPlaybackPressed(false),
        onPointerCancel: () => setIsPlaybackPressed(false),
        onPointerLeave: () => setIsPlaybackPressed(false),
      }
    : {};

  return (
    <div className="relative flex items-stretch bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
      {/* 앨범 커버 — 가로 폭이 이 행 전체 너비의 정확히 20%(반응형)가 되도록 w-1/5로 고정하고,
          aspect-square로 그 폭에서 높이를 역산함. 즉 앨범커버의 "폭"이 행 전체 높이를 결정하는
          기준이 되고(예전엔 반대로 높이가 폭을 역산했음), 오른쪽 정보 영역은 그 높이에 맞춰 늘어남.
          눌러서 바로 재생 */}
      <button
        onClick={() => onPlay(song)}
        {...playbackPressHandlers}
        aria-label={isPlaying ? `${song.title} 일시정지` : `${song.title} 재생`}
        className="relative w-1/5 flex-shrink-0 aspect-square overflow-hidden rounded-l-card active:opacity-80 transition-opacity"
      >
        <img
          src={song.albumArtUrl}
          alt={song.title}
          className="w-full h-full object-cover bg-slate-100"
        />
        {/* control: 재생/일시정지 아이콘을 항상 표시. test: 기본 재생 아이콘은 숨기고 재생 중일 때만 일시정지 아이콘 표시 */}
        {(!isTest || isPlaying) && (
          <span className="absolute inset-0 m-auto w-[34%] aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
            ) : (
              <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
            )}
          </span>
        )}
      </button>

      {/* control: 나머지 전체(곡 정보 + 화살표) — 눌러서 전체보기로 이동
          test: 곡 정보 영역 — 앨범커버와 동일하게 눌러서 바로 재생 (이동은 화살표 버튼이 별도로 담당)
          반응 버튼/이모지 칩이 이 안에 있어서 버튼 안에 버튼을 넣을 수 없으므로, 영역 전체를 덮는 투명 버튼(이동/재생)을 뒤에 깔고
          글자는 클릭이 그 버튼으로 통과되게(pointer-events-none) 하고, 반응 영역만 따로 눌리게(pointer-events-auto) 함 */}
      <div className={`relative flex flex-1 min-w-0 ${isTest ? 'pl-2.5 pr-10 py-1' : 'gap-1 pl-2.5 pr-2'}`}>
        <button
          onClick={() => (isTest ? onPlay(song) : onSelect(song))}
          {...playbackPressHandlers}
          aria-label={isTest ? (isPlaying ? `${song.title} 일시정지` : `${song.title} 재생`) : `${song.title} 전체보기`}
          className={`absolute inset-0 rounded-r-card ${isTest ? '' : 'hover:bg-slate-50 active:bg-slate-100 transition-colors'}`}
        />
        {/* 곡명·가수명 + 한마디 코멘트 + 리액션 요약 — justify-evenly로 맨 위 여백, 줄과 줄 사이 여백들,
            맨 아래 여백까지 전부 똑같은 간격이 되게 함(justify-between은 양 끝 여백 없이 사이만 분배돼서
            원하는 것과 달랐음) */}
        <div className="relative pointer-events-none flex-1 min-w-0 flex flex-col justify-evenly text-left">
          <div className="min-w-0 truncate leading-tight">
            <span className="font-semibold text-text-main text-[15px]">{song.title}</span>
            <span className="text-[13px] text-text-sub"> · {song.artist}</span>
          </div>
          {/* 한마디 코멘트 */}
          {song.comment ? (
            <p className="text-[13px] text-text-main truncate leading-tight">
              <span className="mr-[1px]">"</span>
              {song.comment}
              <span className="ml-[1px]">"</span>
            </p>
          ) : (
            <EmptyCommentNote className="text-[13px] text-text-hint truncate leading-tight" />
          )}
          {/* 이모지와 올린시각  */}
          <div className="flex items-center gap-1 min-w-0 leading-tight">
            <EmojiReactionBar
              reactions={reactions}
              onToggleReaction={toggleReaction}
              disabled={toggleReactionMutation.isPending}
              pickerOpen={pickerOpen}
              onTogglePicker={() => setPickerOpen(!pickerOpen)}
              size="mini"
              className="pointer-events-auto flex-1 min-w-0"
            />
            <span className="flex-shrink-0 text-[11px] text-text-hint">
              {formatTimeAgo(song.createdAt)}
            </span>
          </div>
        </div>

        {!isTest && <ChevronRight size={24} className="relative pointer-events-none text-text-hint flex-shrink-0 self-center" />}
      </div>

      {isTest && (
        <>
          {/* 화살표만 전체보기 이동을 담당하되, 별도 칸처럼 보이지 않도록 정보 영역 위에 얹는다 */}
          <button
            onClick={() => onSelect(song)}
            aria-label={`${song.title} 전체보기`}
            className="absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center text-text-hint active:scale-90 transition-transform"
          >
            <ChevronRight size={24} />
          </button>

          {/* 재생 영역을 누를 때만 카드 전체에 얇게 덮여, 왼쪽만 눌린 듯한 인상을 없앤다 */}
          <span
            aria-hidden="true"
            className={`absolute inset-0 z-20 rounded-card pointer-events-none bg-black/10 transition-opacity duration-100 ${isPlaybackPressed ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      )}
    </div>
  );
}
