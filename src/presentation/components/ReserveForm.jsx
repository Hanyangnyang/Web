// 컴포넌트: 열람실 선택 및 좌석 번호 입력 예약 폼
import React, { useState } from 'react';
import { ROOMS, calcSeatId } from '../../domain/entities/Room.js';

const inputClass = "w-full bg-white border border-[#e2e8f0] rounded-card px-4 py-[0.875rem] text-text-main text-base transition-all duration-200 font-[inherit] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,74,132,0.2)]";

export function ReserveForm({ onReserve, loading, seatReady = true }) {
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const [seatNum, setSeatNum] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!seatNum) return;
    const room = ROOMS[selectedRoomIdx];
    const num = parseInt(seatNum, 10);
    if (isNaN(num) || num <= 0 || num > room.max) {
      alert(`좌석 번호는 1~${room.max} 사이여야 합니다.`);
      return;
    }
    onReserve(calcSeatId(room, num));
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-card p-6 mb-8 w-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] [animation:slideUp_0.4s_ease-out]">
      <div className="text-center mb-6">
        <h3 className="text-[1.15rem] font-bold text-primary mb-1">좌석 예약하기</h3>
        <p className="text-[0.8rem] text-text-sub">열람실과 좌석 번호를 입력하세요</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-sub mb-2 uppercase tracking-[0.05em]">
            열람실 선택
          </label>
          <select
            className={`${inputClass} room-select`}
            value={selectedRoomIdx}
            onChange={e => setSelectedRoomIdx(parseInt(e.target.value, 10))}
          >
            {ROOMS.map((room, idx) => (
              <option key={room.id} value={idx}>{room.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-sub mb-2 uppercase tracking-[0.05em]">
            좌석 번호 (1~{ROOMS[selectedRoomIdx].max})
          </label>
          <input
            type="number"
            className={inputClass}
            value={seatNum}
            onChange={e => setSeatNum(e.target.value)}
            placeholder="좌석 번호"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full mt-4 bg-gradient-to-br from-primary to-[#1e5fa0] text-white border-none rounded-card py-4 text-base font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_0_rgba(14,74,132,0.2)] flex justify-center items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(14,74,132,0.2)] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
          disabled={loading || !seatReady}
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-[spin_0.8s_linear_infinite]" />
            : !seatReady
              ? '정보 불러오는 중...'
              : '좌석 예약하기'}
        </button>
      </form>
    </div>
  );
}
