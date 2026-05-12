// 컴포넌트: 한양대 ERICA 공식 인스타그램 계정 목록 및 프로필 이미지 표시
import React, { useState } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { INSTA_ACCOUNTS } from '../../domain/entities/InstagramAccount.js';
import { useInstagram } from '../hooks/useInstagram.js';

const openInsta = (username) => {
  const start = Date.now();
  window.location.href = `instagram://user?username=${username}`;
  setTimeout(() => {
    if (Date.now() - start < 2000) {
      window.open(`https://www.instagram.com/${username}/`, '_blank');
    }
  }, 500);
};

export function InstagramListView({ onBack }) {
  const [expanded, setExpanded] = useState({ erica: true, college: true });
  const { profiles, getProxiedUrl } = useInstagram();

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const renderItem = (acc) => {
    const profile = profiles[acc.username];
    if (!profile) {
      return (
        <div key={acc.username} className="flex items-center gap-3 px-2 py-3">
          <div className="w-[54px] h-[54px] rounded-full bg-[#e2e8f0] [animation:pulse_1.5s_infinite]" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 bg-[#e2e8f0] rounded w-2/5 [animation:pulse_1.5s_infinite]" />
            <div className="h-3 bg-[#e2e8f0] rounded w-[70%] [animation:pulse_1.5s_infinite]" />
          </div>
        </div>
      );
    }
    return (
      <div key={acc.username} className="flex items-center justify-between px-2 py-3 transition-colors duration-200 active:bg-black/[0.03]">
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
          <img
            src={getProxiedUrl(profile.profilePicUrl)}
            alt={acc.username}
            className="w-[54px] h-[54px] rounded-full object-cover border border-[#efefef]"
          />
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-[0.85rem] text-text-sub truncate">{acc.desc}</span>
            <span className="text-base font-semibold text-text-main truncate">@{acc.username}</span>
          </div>
        </div>
        <button
          className="bg-[#0095f6] text-white border-none rounded px-0 py-[0.4rem] w-[72px] text-center text-[0.8rem] font-bold cursor-pointer transition-opacity duration-200 flex-shrink-0 hover:opacity-90 active:opacity-70"
          onClick={() => openInsta(acc.username)}
        >
          이동하기
        </button>
      </div>
    );
  };

  return (
    <div className="pb-20 [animation:slideUp_0.4s_ease-out]">
      <div className="flex items-center gap-4 mb-6">
        <button
          className="w-10 h-10 rounded-card bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer text-text-main transition-all duration-200 hover:bg-surface"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-extrabold text-text-main mb-0">학교 인스타그램</h2>
      </div>

      <div className="mb-6">
        <div
          className="flex justify-between items-center px-2 py-4 cursor-pointer border-b border-[#e2e8f0] mb-2"
          onClick={() => toggle('erica')}
        >
          <span className="text-base font-bold text-text-main">에리카</span>
          {expanded.erica ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
        </div>
        {expanded.erica && (
          <div className="flex flex-col">
            {INSTA_ACCOUNTS.erica.map(renderItem)}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div
          className="flex justify-between items-center px-2 py-4 cursor-pointer border-b border-[#e2e8f0] mb-2"
          onClick={() => toggle('college')}
        >
          <span className="text-base font-bold text-text-main">단과 대학</span>
          {expanded.college ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
        </div>
        {expanded.college && (
          <div className="flex flex-col">
            {INSTA_ACCOUNTS.college.map(renderItem)}
          </div>
        )}
      </div>
    </div>
  );
}
