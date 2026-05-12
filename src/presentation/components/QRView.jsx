// 컴포넌트: QR 출입증 표시, 자동 갱신, 좌석 예약/반납 UI
import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone } from 'lucide-react';
import { useQR } from '../hooks/useQR.js';
import { useSeat } from '../hooks/useSeat.js';
import { ReserveForm } from './ReserveForm.jsx';

const panelClass = "bg-white py-10 px-8 rounded-card shadow-[0_0_30px_rgba(14,74,132,0.2)] flex flex-col items-center text-center text-text-main [animation:popIn_0.4s_cubic-bezier(0.16,1,0.3,1)]";

const refreshBtnClass = "bg-transparent border border-[#cbd5e1] text-text-sub rounded-full px-5 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2 hover:bg-surface disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none";

const logoutBtnClass = "bg-transparent border-none text-text-hint text-sm cursor-pointer mt-6 hover:text-[#cbd5e1] hover:underline disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none";

export function QRView({ user, reloginFn, onNameDiscovered, onLogout }) {
  const { qrData, status, refreshing, timeLeft, refresh } = useQR({
    user,
    reloginFn,
    onNameDiscovered,
    onLogout,
  });

  const { seatData, loading: seatLoading, seatFetched, fetchSeat, handleReserve, handleSeatReturn } = useSeat({ user });

  useEffect(() => {
    if (status === 'ready' && !refreshing) fetchSeat();
  }, [status, refreshing, fetchSeat]);

  if (status === 'loading') {
    return (
      <div className={panelClass}>
        <h2 className="text-xl font-bold mb-2 text-text-main">출입증 QR</h2>
        {user?.name && (
          <div style={{ marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            {user.name}님 안녕하세요!
          </div>
        )}
        <p className="text-sm text-text-sub mb-8">스캐너에 화면을 인식시켜주세요.</p>
        <div className="bg-white p-4 rounded-card shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-8 flex justify-center items-center relative">
          <QRCodeSVG value="HYUQR_DUMMY_LOADING" size={220} level="M" className="blur-[4px] opacity-55 pointer-events-none" />
          <div className="absolute inset-0 flex justify-center items-center bg-white/60 rounded-card">
            <div className="w-10 h-10 border-4 border-black/10 rounded-full border-t-primary animate-[rotate_0.8s_linear_infinite]" />
          </div>
        </div>
        <div style={{ color: 'var(--color-success)', fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>
          Refreshing...
        </div>
        <button className={refreshBtnClass} disabled style={{ marginBottom: '1.5rem' }}>
          <RefreshCw size={16} className="spin-animation" />
          <span>Refreshing...</span>
        </button>
        <ReserveForm onReserve={handleReserve} loading={seatLoading} seatReady={false} />
        <button className={logoutBtnClass} disabled>로그아웃</button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={panelClass}>
        <p style={{ color: 'var(--color-error)', fontWeight: '600', marginBottom: '0.5rem' }}>오류가 발생했습니다.</p>
        <p style={{ color: 'var(--color-text-sub)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          인증 세션이 만료되었거나<br />통신 상태가 원활하지 않습니다.
        </p>
        <button className={refreshBtnClass} onClick={refresh}>다시 시도</button>
        <button className={logoutBtnClass} onClick={onLogout}>로그아웃</button>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <h2 className="text-xl font-bold mb-2 text-text-main">출입증 QR</h2>
      {user?.name && (
        <div style={{ marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          {user.name}님 안녕하세요!
        </div>
      )}
      <p className="text-sm text-text-sub mb-8">스캐너에 화면을 인식시켜주세요.</p>

      <div className="bg-white p-4 rounded-card shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-8 flex justify-center items-center relative">
        <QRCodeSVG value={qrData} size={220} level="M" className={refreshing ? 'blur-[10px] opacity-50 pointer-events-none' : ''} />
        {refreshing && (
          <div className="absolute inset-0 flex justify-center items-center bg-white/60 rounded-card">
            <div className="w-10 h-10 border-4 border-black/10 rounded-full border-t-primary animate-[rotate_0.8s_linear_infinite]" />
          </div>
        )}
      </div>

      <div style={{ color: timeLeft <= 5 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>
        {refreshing ? 'Refreshing...' : `유효시간: ${timeLeft}초`}
      </div>

      <button
        className={refreshBtnClass}
        onClick={refresh}
        disabled={refreshing}
        style={{ marginBottom: '1.5rem' }}
      >
        <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />
        <span>{refreshing ? 'Refreshing...' : 'QR 새로고침'}</span>
      </button>

      {seatData ? (
        <SeatInfoCard
          seatData={seatData}
          onReturn={() => handleSeatReturn(seatData)}
          loading={seatLoading}
        />
      ) : (
        <ReserveForm onReserve={handleReserve} loading={seatLoading} seatReady={seatFetched} />
      )}

      <button className={logoutBtnClass} onClick={onLogout}>로그아웃</button>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-hint)', fontSize: '0.75rem' }}>
        <Smartphone size={14} /> 화면 밝기 최대 권장
      </div>
    </div>
  );
}

function SeatInfoCard({ seatData, onReturn, loading }) {
  const isTemp = seatData.state?.code === 'TEMP_CHARGE';
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-card p-5 mb-6 flex flex-col gap-3 w-full shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] bg-gradient-to-r ${
      isTemp
        ? 'from-[rgba(243,156,18,0.05)] to-white'
        : 'border-l-[4px] border-l-success from-[rgba(39,174,96,0.05)] to-white'
    }`}>
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <div className="flex flex-col items-start">
          <span className={`text-[0.7rem] font-extrabold px-2 py-0.5 rounded-full uppercase mb-1 inline-block ${
            isTemp
              ? 'bg-[rgba(243,156,18,0.12)] text-warning-dark'
              : 'bg-[rgba(39,174,96,0.12)] text-success-dark'
          }`}>
            {isTemp ? '확정 대기중' : '좌석 이용중'}
          </span>
          <span className="font-semibold text-text-main text-[0.95rem]">{seatData.room?.name}</span>
        </div>
        <span className="bg-primary text-white px-[0.6rem] py-[0.2rem] rounded-full font-bold text-[0.85rem] shadow-[0_4px_12px_rgba(14,74,132,0.4)]">
          {seatData.seatNumber}번 좌석
        </span>
      </div>

      {isTemp && seatData.checkinExpiryDate && (
        <div style={{ background: 'rgba(243,156,18,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--color-warning-dark)', fontWeight: '700', textAlign: 'center' }}>
          ⚠️ {seatData.checkinExpiryDate.substring(11, 16)}까지 좌석 배정을 완료해주세요
        </div>
      )}

      {!isTemp && (
        <div className="flex justify-between items-center text-[0.85rem] text-text-sub pt-[0.2rem]">
          <span>반납 예정: {seatData.endTime?.substring(11, 16)}</span>
          <span className="text-success font-bold" style={{ color: 'var(--success)' }}>
            ({seatData.remainTime}분 남음)
          </span>
        </div>
      )}

      <button
        className="w-full bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-error rounded-card py-[0.6rem] text-[0.85rem] font-semibold cursor-pointer mt-3 transition-all duration-200 hover:bg-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onReturn}
        disabled={loading}
      >
        {isTemp ? '예약 취소하기' : '좌석 반납하기'}
      </button>
    </div>
  );
}
