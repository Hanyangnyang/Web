import React, { useState, useRef } from 'react';
import { isNativeApp, getPlatform } from '../../lib/platform';
import { isPwaStandalone, openSystemSettings } from '../../lib/alarmPrompt';

export function PermissionDeniedGuide({ onClose }) {
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const backdropRef = useRef(null);
  const sheetRef = useRef(null);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  // 플랫폼별 맞춤 멘트 및 UI 구성 판별
  const platform = getPlatform(); // 'ios' | 'android' | 'web'
  const isPwa = isPwaStandalone();
  const isNative = isNativeApp();

  let title = "알림 권한이 차단되어 있습니다";
  let description = null;
  let actionButtonText = "확인";
  let onActionButtonClick = handleClose;

  if (isNative) {
    // 📱 네이티브 앱
    title = "알림 권한을 켜주세요";
    description = (
      <span>
        기기 설정에서 하냥냥 알림을 허용해야<br />
        실시간 알림을 받아보실 수 있습니다.
      </span>
    );
    actionButtonText = "설정으로 이동";
    onActionButtonClick = async () => {
      await openSystemSettings();
      handleClose();
    };
  } else if (isPwa) {
    // 📦 PWA 독립 모드
    if (platform === 'ios') {
      description = (
        <span>
          아이폰 **[설정 ➔ 알림 ➔ 하냥냥]** 메뉴로<br />
          이동하여 **[알림 허용]**을 활성화해 주세요.
        </span>
      );
    } else {
      description = (
        <span>
          홈 화면의 **하냥냥 아이콘을 길게 누르고 (Long Press)**<br />
          ➔ **'앱 정보 (ⓘ 아이콘)'** ➔ **'알림'** 메뉴에서<br />
          권한을 **[허용]**해 주세요.
        </span>
      );
    }
  } else {
    // 💻 일반 웹 브라우저
    description = (
      <span>
        브라우저 주소창 왼쪽의 **🔒 자물쇠 아이콘**을<br />
        클릭하고 알림 권한을 **[허용]**으로 변경해 주세요.
      </span>
    );
  }

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
      handleClose();
    } else {
      setDragY(0);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/45 z-[1300] flex items-end justify-center animate-fade-in"
      style={{ animation: closing ? 'fadeOut 0.26s ease forwards' : 'fadeIn 0.2s ease' }}
      onClick={handleClose}
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
          <span className="text-[26px]">🔒</span>
          <h3 className="text-[16px] font-extrabold text-text-main mt-2.5 leading-snug">
            {title}
          </h3>
          <p className="text-[12px] text-text-sub mt-2.5 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-5">
          <button
            onClick={onActionButtonClick}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-[13px] font-extrabold transition-all shadow-[0_2px_8px_rgba(14,74,132,0.18)]"
          >
            {actionButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
