import React, { useState, useEffect, useRef } from 'react';
import { requestNotificationPermission } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { getPlatform } from '../../lib/platform';
import { setAlarmPromptCooldown, checkShouldShowAlarmPrompt } from '../../lib/alarmPrompt';

async function getOrCreateSecureDeviceId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    return session.user.id;
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session.user.id;
}

export function EventAlarmPrompt() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const backdropRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    async function checkPromptVisibility() {
      const shouldShow = await checkShouldShowAlarmPrompt();
      if (shouldShow) {
        setVisible(true);
      }
    }
    checkPromptVisibility();
  }, []);

  const triggerClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 250);
  };

  const handleDismiss = () => {
    setAlarmPromptCooldown();
    triggerClose();
  };

  const handleAccept = async () => {
    triggerClose();
    try {
      const token = await requestNotificationPermission();
      if (token) {
        const deviceId = await getOrCreateSecureDeviceId();
        const params = {
          mode: 'notice',
          consentedAt: new Date().toISOString()
        };

        await supabase.rpc('upsert_alarm_subscription', {
          p_device_id: deviceId,
          p_fcm_token: token,
          p_topic: 'NOTICE',
          p_params: params,
          p_is_active: true,
          p_platform: getPlatform()
        });
      }
    } catch (err) {
      console.error('Failed to register NOTICE alarm subscription:', err);
    }
  };

  // 드래그 제어 핸들러
  const handleTouchStart = (e) => {
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      if (e.cancelable) e.preventDefault();
      setDragY(deltaY);
    } else {
      setDragY(0);
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 100) {
      handleDismiss();
    } else {
      setDragY(0);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/45 z-[1200] flex items-end justify-center"
      style={{ animation: closing ? 'fadeOut 0.26s ease forwards' : 'fadeIn 0.2s ease' }}
      onClick={handleDismiss}
    >
      <div
        ref={sheetRef}
        className="w-[calc(100%-48px)] max-w-[340px] bg-white rounded-card rounded-b-none px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 max-h-[90vh] overflow-y-auto mb-0 relative select-none shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: closing ? 'sheetDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards' : 'sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform'
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="py-2 mb-2">
          <div className="w-9 h-1 bg-[#e2e8f0] rounded-full mx-auto" />
        </div>

        <div className="text-center py-2">
          <span className="text-[26px]">🔔</span>
          <h3 className="text-[17px] font-extrabold text-text-main mt-2.5 leading-snug">
            이벤트 및 소식 알림 받기
          </h3>
          <p className="text-[12px] text-text-sub mt-2 leading-relaxed">
            내일부터 시작되는 앱 홍보 이벤트 혜택 소식과<br />
            실시간 중요 공지사항을 받아보시겠어요?
          </p>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-text-sub rounded-button text-[13px] font-extrabold transition-all"
          >
            다음에 하기
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-3 bg-primary text-white rounded-button text-[13px] font-extrabold transition-all shadow-[0_2px_8px_rgba(14,74,132,0.18)]"
          >
            알림 받기
          </button>
        </div>
      </div>
    </div>
  );
}
