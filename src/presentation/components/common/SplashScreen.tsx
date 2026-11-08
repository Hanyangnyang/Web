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

  // 배너 유무와 무관하게 로고 그룹(row-start-2)이 항상 정확히 같은 자리(화면 정중앙)에 오도록
  // grid로 위/아래 여백을 1fr씩 대칭으로 둔다. 배너는 마스코트 바로 아래(row-start-3 self-start)에 붙어 표시
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white grid grid-rows-[1fr_auto_1fr] justify-items-center transition-opacity duration-[450ms] ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onTransitionEnd={() => fading && onDone()}
    >
      {/* 중앙 브랜드 로고 (하냥냥 글자 + 발바닥 순차 팝업 애니메이션) & 슬로건 */}
      <div className="row-start-2 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <img
            src="/hanyang_splash_text.png"
            className="h-[52px] sm:h-16 w-auto object-contain splash-logo-anim-text"
            alt="하냥냥"
          />
          <img
            src="/hanyang_splash_paw.png"
            className="h-[52px] sm:h-16 w-auto object-contain splash-logo-anim-paw"
            alt="발바닥"
          />
        </div>
        <p className="text-[0.8rem] font-medium text-text-hint splash-logo-anim-sub">
          에리카 생활을 위한 꿀정보 모음
        </p>
      </div>

      {splashBanner && !bannerBroken && (
        <div className="row-start-3 self-start w-full max-w-app px-12 mt-4">
          <img
            src={splashBanner.imageUrl}
            alt={splashBanner.altText || '배너'}
            className="w-full aspect-[2/1] object-cover rounded-2xl shadow-sm"
            onError={() => setBannerBroken(true)}
          />
        </div>
      )}
    </div>
  );
}
