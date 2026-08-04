// 컴포넌트: 한 글자씩 타이핑되는 애니메이션 텍스트 (날씨 AI 코멘트용)
import { useState, useEffect } from 'react';

// 모듈 레벨 메모리 변수: 앱이 켜진 세션 동안 한 번 완벽히 타이핑이 끝나면 이를 기억하여 내부 탭 전환 시 생략
let hasAnimatedThisSession = false;

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  isVisible?: boolean;
}

export function TypewriterText({ text, speed = 55, delay = 2000, isVisible = true }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState(() => {
    return hasAnimatedThisSession ? text : '';
  });
  const [waiting, setWaiting] = useState(false); // delay 구간 (커서 깜빡임)

  useEffect(() => {
    // 1. 이미 이번 세션에 애니메이션이 완료되었다면 즉시 전문 노출 및 생략
    if (hasAnimatedThisSession) {
      setDisplayed(text);
      setWaiting(false);
      return;
    }

    // 2. 탭이 숨겨지거나 텍스트가 아직 없는 경우 플래그 리셋 및 대기
    if (!isVisible || !text) {
      setWaiting(false);
      return;
    }

    // 3. 타이핑 진행 시작
    setDisplayed('');
    setWaiting(true); // 커서 깜빡임 시작

    let i = 0;
    let typingTimer: ReturnType<typeof setInterval> | null = null;

    const startTyping = () => {
      setWaiting(false); // 커서 제거 후 타이핑 시작
      typingTimer = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          if (typingTimer !== null) clearInterval(typingTimer);
          hasAnimatedThisSession = true; // 타이핑이 완벽히 한 번 끝나면 세션 플래그 true 설정
        }
      }, speed);
    };

    const delayTimer = setTimeout(startTyping, delay);
    return () => {
      clearTimeout(delayTimer);
      if (typingTimer) clearInterval(typingTimer);
    };
  }, [text, isVisible]);

  return (
    <span>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typewriterBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
      {displayed || '​'}
      {waiting && (
        <span
          className="inline-block w-[2px] h-[1.1em] bg-white ml-0.5 align-middle rounded-sm"
          style={{ animation: 'typewriterBlink 1.2s steps(2, start) infinite' }}
        />
      )}
    </span>
  );
}
