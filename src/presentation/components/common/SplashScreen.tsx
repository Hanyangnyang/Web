import React, { useState, useEffect } from 'react';
import { useSplashBanner } from '../../hooks/useSplashBanner.js';

interface SplashScreenProps {
  ready: boolean;
  onDone: () => void;
  variant?: 'default' | 'menu';
}

export function SplashScreen({ ready, onDone, variant = 'default' }: SplashScreenProps) {
  const [fading, setFading] = useState(false);
  const [minDone, setMinDone] = useState(false);
  // 이전 세션에 캐싱된 배너가 있을 때만(=2번째 이상 진입) 하나 무작위로 보여준다.
  // 네트워크 응답을 기다리게 하면 스플래시 취지에 반하므로 부팅 완료 여부(ready)와는 무관하게 렌더만 하고,
  // 이미지 로드 실패는 스플래시를 막지 않도록 조용히 숨긴다(BOOT_ARCHITECTURE 원칙과 동일하게 부가 기능은 부팅을 막지 않는다)
  const splashBanner = useSplashBanner();
  const [bannerBroken, setBannerBroken] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && minDone) setFading(true);
  }, [ready, minDone]);

  if (variant === 'menu') {
    return (
      <div
        className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-[450ms] ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onTransitionEnd={() => fading && onDone()}
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[1.15rem] font-bold text-text-main tracking-[-0.02em]">
              학식 메뉴를 불러오고 있어요
            </p>
            <p className="text-[0.82rem] text-text-hint">잠시만 기다려 주세요</p>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    );
  }

  // 배너 유무와 무관하게 마스코트 그룹(row-start-2)이 항상 정확히 같은 자리(화면 정중앙)에 오도록
  // grid로 위/아래 여백을 1fr씩 대칭으로 둔다. 배너가 없으면 3행이 그냥 빈 채로 아래 여백에 흡수되고,
  // 있으면 마스코트 바로 아래(self-start)에 붙어 그 여백 공간을 위에서부터 채운다 — 마스코트 위치는 안 변함
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white grid grid-rows-[1fr_auto_1fr] justify-items-center transition-opacity duration-[450ms] ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onTransitionEnd={() => fading && onDone()}
    >
      <div className="row-start-2 flex flex-col items-center gap-4">
        <img
          src="/hanyang_splash.png"
          className="w-[200px] h-[200px] object-contain [animation:splash-pop_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
          alt="하냥냥"
        />
        <p className="text-[1.4rem] text-primary tracking-[0.04em] [animation:splash-pop_0.5s_0.12s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ fontFamily: "'HakgyoansimDunggeunmiso', sans-serif" }}>
          하냥냥
        </p>
        <p className="text-[0.8rem] font-medium text-text-hint [animation:splash-pop_0.5s_0.22s_cubic-bezier(0.16,1,0.3,1)_both]">
          에리카 생활을 위한 꿀정보 모음
        </p>
      </div>

      {splashBanner && !bannerBroken && (
        <div className="row-start-3 self-start w-full max-w-app px-12 mt-4">
          <img
            src={splashBanner.imageUrl}
            alt={splashBanner.altText || '배너'}
            className="w-full aspect-[10/3] object-cover rounded-xl"
            onError={() => setBannerBroken(true)}
          />
        </div>
      )}
    </div>
  );
}
