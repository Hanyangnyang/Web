// 컴포넌트: 기타탭 화면 오케스트레이터 (그리드 ↔ 하위 View 라우팅)
import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { GymView } from './GymView.jsx';
import { InstagramView } from './InstagramView.jsx';
import { FeedbackView } from './FeedbackView.jsx';
import { MiscMenuGrid, type MiscBoxKey } from './MiscMenuGrid.jsx';

type SubView = 'list' | MiscBoxKey;

interface MiscViewProps {
  resetSignal: number;
}

export function MiscView({ resetSignal }: MiscViewProps) {
  const posthog = usePostHog();
  const [subView, setSubView] = useState<SubView>('list');

  useEffect(() => {
    setSubView('list');
  }, [resetSignal]);

  const handleBoxClick = (box: MiscBoxKey) => {
    posthog?.capture('misc_box_clicked', { box });
    if (box === 'calendar') {
      window.open('https://www.hanyang.ac.kr/-93', '_blank', 'noopener,noreferrer');
    } else {
      setSubView(box);
    }
  };

  if (subView === 'gym') return <GymView onBack={() => setSubView('list')} />;
  if (subView === 'insta') return <InstagramView onBack={() => setSubView('list')} />;
  if (subView === 'feedback') return <FeedbackView onBack={() => setSubView('list')} />;

  return <MiscMenuGrid onBoxClick={handleBoxClick} />;
}
