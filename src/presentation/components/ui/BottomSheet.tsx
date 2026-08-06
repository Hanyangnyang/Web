// 컴포넌트: 알람 설정·공유 등에서 공통으로 쓰는 바텀시트 껍데기
// (백드롭+슬라이드업 애니메이션, 드래그로 닫기, iOS 배경 스크롤 잠금, 하드웨어 뒤로가기 연동)
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode, TouchEvent as ReactTouchEvent } from 'react';
import { useBackHandler } from '../../hooks/useBackHandler.js';

const CLOSE_ANIMATION_MS = 250;
const DRAG_CLOSE_THRESHOLD = 120;

export interface BottomSheetProps {
  // 닫힘이 트리거된 시점(백드롭 클릭 / 드래그로 닫기 / 하드웨어 뒤로가기)에 동기적으로 1회 실행.
  // 반환값은 닫힘 애니메이션이 끝난 뒤 onClose로 그대로 전달됨 (ex: 저장 성공 메시지)
  onRequestClose: () => string | undefined | void;
  // 닫힘 애니메이션(약 250ms)이 끝난 뒤 1회 호출 — 보통 부모의 언마운트 트리거
  onClose: (message?: string) => void;
  children: ReactNode;
  // 시트 박스(폭/라운딩/패딩 등)에 덧붙일 className. 백드롭·시트 셸 공통 스타일은 컴포넌트가 고정으로 가짐
  className?: string;
  zIndex?: number;
  enableDragToClose?: boolean;
  enableScrollLock?: boolean;
  // 백드롭 터치무브를 막을 때 예외로 둘 내부 스크롤 영역 selector (ex: '.alarm-picker-scroll')
  scrollExemptSelector?: string;
}

export function BottomSheet({
  onRequestClose,
  onClose,
  children,
  className = '',
  zIndex = 1100,
  enableDragToClose = true,
  enableScrollLock = true,
  scrollExemptSelector,
}: BottomSheetProps) {
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 닫힘 요청 → 도메인 쪽 커밋 로직 실행 → 애니메이션 재생 → 애니메이션 끝난 뒤 onClose 호출
  const requestClose = () => {
    const msg = onRequestClose() ?? undefined;
    setClosing(true);
    setTimeout(() => onClose(msg), CLOSE_ANIMATION_MS);
  };

  // iOS 배경 스크롤 잠금 (position:fixed 대신 클래스 토글로 레이아웃 점프 방지)
  useEffect(() => {
    if (!enableScrollLock) return;
    document.documentElement.classList.add('scroll-locked');
    document.body.classList.add('scroll-locked');
    return () => {
      document.documentElement.classList.remove('scroll-locked');
      document.body.classList.remove('scroll-locked');
    };
  }, [enableScrollLock]);

  // 백드롭 터치무브 방지 (iOS에서 배경 스크롤 방지, 내부 스크롤 영역은 예외)
  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => {
      if (scrollExemptSelector && (e.target as HTMLElement).closest(scrollExemptSelector)) return;
      e.preventDefault();
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, [scrollExemptSelector]);

  // 드래그 제어 핸들러 (전체 시트용, 마우스/터치 겸용)
  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>) => {
    if (!enableDragToClose) return;
    // 내부 스크롤 중이면 드래그 무시
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return;
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY.current;
    // 아래로 내릴 때만 시트 이동
    if (deltaY > 0) {
      if (e.cancelable) e.preventDefault();
      setDragY(deltaY);
    } else {
      // 위로 올리려 할 때는 드래그 중단 (내부 스크롤 허용)
      setDragY(0);
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > DRAG_CLOSE_THRESHOLD) {
      requestClose();
    } else {
      setDragY(0);
    }
  };

  // 안드로이드 하드웨어 뒤로가기를 눌렀을 때 앱 종료 대신 시트 닫기
  useBackHandler(requestClose);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/45 flex items-end justify-center"
      style={{ zIndex, animation: closing ? 'fadeOut 0.26s ease forwards' : 'fadeIn 0.2s ease' }}
      onClick={requestClose}
    >
      <div
        ref={sheetRef}
        className={`bg-white max-h-[90vh] overflow-y-auto relative select-none shadow-[0_8px_32px_rgba(0,0,0,0.12)] ${className}`}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: closing ? 'sheetDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards' : 'sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
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
        <div className="py-3">
          <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto" />
        </div>
        {children}
      </div>
    </div>
  );
}
