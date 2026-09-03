import { useEffect, useState } from 'react';
import { type TrackSummary } from '../playlistTypes';

// 뒤로가기 시 임시저장한 곡추천하기 초안 — 기기(브라우저)당 1개만 유지
const DRAFT_STORAGE_KEY = 'hyu_add_song_draft_v1';
const DRAFT_RESTORED_TOAST_MS = 2500;

export interface AddSongDraft {
  track: TrackSummary | null;
  selectedGenres: string[];
  comment: string;
}

function loadDraft(): AddSongDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AddSongDraft) : null;
  } catch {
    return null;
  }
}

function saveDraftToStorage(draft: AddSongDraft) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // 시크릿 모드 등 localStorage 접근 불가 시 임시저장은 부가 기능이라 조용히 무시
  }
}

function clearDraftFromStorage() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // 위와 동일
  }
}

// 곡추천하기 화면 진입 시 임시저장된 초안이 있으면 한 번 불러와서("작성 중이던 내용을 불러왔어요"
// 토스트를 잠깐 보여줌) 초기값으로 쓸 수 있게 해주고, 저장/삭제는 화면이 원하는 시점에 호출
export function useAddSongDraft() {
  const [initialDraft] = useState(() => loadDraft());
  const [restoredToast, setRestoredToast] = useState(initialDraft ? '작성 중이던 내용을 불러왔어요' : '');

  useEffect(() => {
    if (!restoredToast) return;
    const timer = setTimeout(() => setRestoredToast(''), DRAFT_RESTORED_TOAST_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 초안 복원 여부만 한 번 확인하면 됨
  }, []);

  return {
    initialDraft,
    restoredToast,
    saveDraft: saveDraftToStorage,
    clearDraft: clearDraftFromStorage,
  };
}
