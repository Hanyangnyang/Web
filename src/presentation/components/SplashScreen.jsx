import React, { useState, useEffect } from 'react';

export function SplashScreen({ ready, onDone }) {
  const [fading, setFading] = useState(false);
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && minDone) setFading(true);
  }, [ready, minDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4 transition-opacity duration-[450ms] ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onTransitionEnd={() => fading && onDone()}
    >
      <img
        src="/hanyang_splash.png"
        className="w-[200px] h-[200px] object-contain [animation:splash-pop_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
        alt="하냥냥"
      />
      <p className="text-[1.4rem] font-extrabold text-primary tracking-[0.04em] [animation:splash-pop_0.5s_0.12s_cubic-bezier(0.16,1,0.3,1)_both]">
        하냥냥
      </p>
      <p className="text-[0.8rem] font-medium text-text-hint [animation:splash-pop_0.5s_0.22s_cubic-bezier(0.16,1,0.3,1)_both]">
        에리카 생활을 위한 꿀정보 모음
      </p>
    </div>
  );
}
