// 훅(ViewModel): 재생 버튼이 눌리는 곳 어디서든 호출하는 재생수 기록(인기차트 집계용) — 결과를 화면에서 안 써서 fire-and-forget
import { useMutation } from '@tanstack/react-query';
import { recordTrackPlayUseCase } from '../../../di.js';

export function useRecordTrackPlay() {
  return useMutation({
    mutationKey: ['playlist', 'record-track-play'],
    mutationFn: (trackId: string) => recordTrackPlayUseCase.execute(trackId),
  });
}
