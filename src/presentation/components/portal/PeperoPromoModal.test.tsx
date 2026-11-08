import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PeperoPromoModal } from './PeperoPromoModal.js';

const mockCapture = vi.fn();
vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: mockCapture }),
}));

describe('PeperoPromoModal', () => {
  const storage = new Map<string, string>();
  const setItemSpy = vi.fn((key: string, value: string) => {
    storage.set(key, value);
  });

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: setItemSpy,
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  });

  beforeEach(() => {
    storage.clear();
    setItemSpy.mockClear();
    mockCapture.mockClear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  it('isOpen이 false이면 렌더링되지 않는다', () => {
    const { container } = render(<PeperoPromoModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('isOpen이 true이면 요청된 순서대로 홍보 텍스트와 이미지들이 모두 렌더링된다', () => {
    render(<PeperoPromoModal isOpen={true} onClose={vi.fn()} />);

    // 큰 타이틀 & 인사말
    expect(screen.getByText(/진심을 전해요/)).toBeTruthy();
    expect(screen.getByText('안녕하세요! 하냥냥 개발자입니다')).toBeTruthy();
    expect(screen.getByText(/학교 쪽문에서 선물 세트를 판매합니다!/)).toBeTruthy();

    // 하냥냥 픽업 예약 혜택
    expect(screen.getByText(/하냥냥 픽업 예약 혜택/)).toBeTruthy();
    expect(screen.getByText(/이 게시물을 통해 픽업 예약하면 할인해드려요!/)).toBeTruthy();
    expect(screen.getByText(/현장 구매시/)).toBeTruthy();
    expect(screen.getByText('11,111원')).toBeTruthy();
    expect(screen.getByText('픽업 예약시')).toBeTruthy();
    expect(screen.getByText('10,000원')).toBeTruthy();

    // 상품 비교
    expect(screen.getByText('핑크')).toBeTruthy();
    expect(screen.getByText('레드')).toBeTruthy();
    expect(screen.getByText('핑크 거베라 + 딸기 빼빼로')).toBeTruthy();
    expect(screen.getByText('레드 거베라 + 오리지널 빼빼로')).toBeTruthy();

    // 운영 시간 및 장소 안내
    expect(screen.getByText('운영 시간 및 장소 안내')).toBeTruthy();
    expect(screen.getByText(/11월 11일 수요일/)).toBeTruthy();
    expect(screen.getByText(/학교 쪽문 주황색 부스/)).toBeTruthy();

    // 마무리 인사
    expect(screen.getByText('항상 하냥냥을 이용해주셔서 감사드려요')).toBeTruthy();
    expect(screen.getByText('성큼 찾아온 겨울에 감기 조심하세요')).toBeTruthy();

    // 닫기 및 예약 버튼
    expect(screen.getByRole('button', { name: '닫기' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /픽업 예약하기/ })).toBeTruthy();
  });

  it('닫기 버튼을 누르면 애니메이션 후 onClose가 호출된다', () => {
    const onCloseSpy = vi.fn();
    render(<PeperoPromoModal isOpen={true} onClose={onCloseSpy} />);

    const closeBtn = screen.getByRole('button', { name: '닫기' });
    fireEvent.click(closeBtn);

    expect(onCloseSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('카카오톡 픽업 예약하기 버튼을 클릭하면 지정된 링크가 새 창으로 열린다', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <PeperoPromoModal
        isOpen={true}
        onClose={vi.fn()}
        reservationUrl="https://open.kakao.com/o/pepero"
      />
    );

    const actionBtn = screen.getByRole('button', { name: /픽업 예약하기/ });
    fireEvent.click(actionBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith('https://open.kakao.com/o/pepero', '_blank', 'noopener,noreferrer');
  });

  it('다시 보지 않기를 체크하면 체크 상태가 반영되고 잠시 후 자동으로 팝업이 닫힌다', () => {
    const onCloseSpy = vi.fn();
    render(<PeperoPromoModal isOpen={true} onClose={onCloseSpy} />);

    const checkbox = screen.getByRole('checkbox', { name: /다시 보지 않기/ }) as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(checkbox.checked).toBe(true);
    expect(setItemSpy).toHaveBeenCalledWith('hide_pepero_auto_popup', 'true');
    expect(onCloseSpy).not.toHaveBeenCalled();

    // 체크된 것을 확인하는 딜레이(250ms) + 닫힘 애니메이션(200ms)
    act(() => {
      vi.advanceTimersByTime(260);
    });
    act(() => {
      vi.advanceTimersByTime(210);
    });

    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('showDontShowAgain이 false(소식탭에서 직접 열었을 때)이면 다시 보지 않기 체크박스가 렌더링되지 않는다', () => {
    render(<PeperoPromoModal isOpen={true} onClose={vi.fn()} showDontShowAgain={false} />);
    expect(screen.queryByRole('checkbox', { name: /다시 보지 않기/ })).toBeNull();
  });

  it('열림, 터치 횟수, 머문 시간, 닫힘 이벤트가 PostHog에 정상 캡처된다', () => {
    const { unmount } = render(
      <PeperoPromoModal
        isOpen={true}
        onClose={vi.fn()}
        showDontShowAgain={true}
      />
    );

    // 열림 이벤트 확인
    expect(mockCapture).toHaveBeenCalledWith('pepero_promo_modal_opened', {
      trigger: 'auto_popup',
    });

    // 2초 경과 + 터치 2회 발생
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const closeBtn = screen.getByRole('button', { name: '닫기' });
    fireEvent.pointerDown(closeBtn);
    fireEvent.click(closeBtn);

    // 닫힘 이벤트 확인
    expect(mockCapture).toHaveBeenCalledWith(
      'pepero_promo_modal_closed',
      expect.objectContaining({
        trigger: 'auto_popup',
        duration_seconds: 2,
        touch_count: 1,
        close_method: 'x_button',
      })
    );
  });
});
