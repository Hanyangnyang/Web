import React, { useState, useEffect } from 'react';

export function SplashScreen({ ready, onDone, variant = 'default' }) {
  const [fading, setFading] = useState(false);
  const [minDone, setMinDone] = useState(false);

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

    </div>
  );
}
