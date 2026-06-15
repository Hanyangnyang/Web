import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, Gamepad2 } from 'lucide-react';
import { AppleGame } from './AppleGame.jsx';

export function GameLobby({ onBack }) {
  const [activeGame, setActiveGame] = useState(null); // null | 'apple'

  if (activeGame === 'apple') {
    return <AppleGame onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="w-full flex flex-col [animation:slideUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-card bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer text-text-main transition-all duration-200 hover:bg-surface active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-2xl font-extrabold text-text-main mb-0 flex items-center gap-2">
            하냥냥 미니게임 <Gamepad2 size={24} className="text-hyu-blue-light" />
          </h2>
        </div>
      </div>

      <p className="text-[13px] text-[#64748b] font-medium mb-6 leading-relaxed">
        학교 쉬는 시간이나 공강 시간에 간단하게 즐길 수 있는 미니게임 공간입니다.
      </p>

      {/* Games List */}
      <div className="grid grid-cols-1 gap-4">
        {/* Apple Game Card */}
        <div 
          onClick={() => setActiveGame('apple')}
          className="bg-white border border-[#e2e8f0] rounded-3xl p-5 flex items-center justify-between cursor-pointer hover:border-red-400 hover:shadow-md transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform duration-200">
              🍎
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-extrabold text-text-main group-hover:text-red-500 transition-colors">사과게임 (Fruit Box)</span>
              <span className="text-xs text-text-sub mt-1">숫자의 합이 10이 되도록 드래그하여 지우기</span>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full bg-red-50 group-hover:bg-red-500 group-hover:text-white text-red-500 flex items-center justify-center transition-all">
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </button>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-slate-50/50 border border-dashed border-[#e2e8f0] rounded-3xl p-5 flex items-center gap-4 select-none opacity-70">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl">
            🎮
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-slate-400 flex items-center gap-1.5">
              준비 중... <Sparkles size={14} className="text-slate-300" />
            </span>
            <span className="text-xs text-slate-400 mt-1">더 많은 재미있는 미니게임이 추가될 예정입니다!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
