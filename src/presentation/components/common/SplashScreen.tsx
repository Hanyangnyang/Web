import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  ready: boolean;
  onDone: () => void;
  variant?: 'default' | 'menu';
}

export function SplashScreen({ ready, onDone, variant = 'default' }: SplashScreenProps) {
  const [fading, setFading] = useState(false);
  const [minDone, setMinDone] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

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

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center transition-opacity duration-[450ms] ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onTransitionEnd={() => fading && onDone()}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-[200px] h-[200px] relative">
          {/* 느린 네트워크에서 PNG가 위에서부터 잘려 그려지는 것을 막기 위해,
              완전히 로드되기 전까지는 shimmer로 대신 보여주고 로드 완료 시 교체한다.
              원본 이미지의 실제 캐릭터 영역(투명 여백 제외)이 356x466(가로:세로 0.764)이라,
              200px 높이 기준 폭 153px로 맞춰서 실제 하냥이 실루엣과 비슷한 비율로 표시한다 */}
          {!imgLoaded && (
            <div
              data-testid="splash-shimmer"
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[153px] rounded-card bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse"
            />
          )}
          <img
            src="/hanyang_splash.png"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100 [animation:splash-pop_0.5s_cubic-bezier(0.16,1,0.3,1)_both]' : 'opacity-0'}`}
            alt="하냥냥"
          />
        </div>
        <p className="text-[1.4rem] text-primary tracking-[0.04em] [animation:splash-pop_0.5s_0.12s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ fontFamily: "'HakgyoansimDunggeunmiso', sans-serif" }}>
          하냥냥
        </p>
        <p className="text-[0.8rem] font-medium text-text-hint [animation:splash-pop_0.5s_0.22s_cubic-bezier(0.16,1,0.3,1)_both]">
          에리카 생활을 위한 꿀정보 모음
        </p>
      </div>

    </div>
  );
}
