// 훅(ViewModel): 곡 신고하기 — 접수 성공 여부만 필요해서 결과값은 없음
import { useMutation } from '@tanstack/react-query';
import { reportSongUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';

export interface ReportSongInput {
  songId: string;
  reason: string;
}

export function useReportSong() {
  return useMutation({
    mutationKey: ['playlist', 'report-song'],
    mutationFn: async ({ songId, reason }: ReportSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      await reportSongUseCase.execute({ songId, deviceId, reason });
    },
  });
}
