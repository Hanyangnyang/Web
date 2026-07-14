// 컴포넌트: 한양대 ERICA 공식 인스타그램 계정 목록 및 프로필 이미지 표시
import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
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

function AccountItem({ acc, isFirst, profile, getProxiedUrl }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <>
      {!isFirst && <div className="mx-4 border-b border-dashed border-slate-200" />}
      {!profile ? (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-[54px] h-[54px] rounded-full bg-[#e2e8f0] [animation:pulse_1.5s_infinite]" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 bg-[#e2e8f0] rounded w-2/5 [animation:pulse_1.5s_infinite]" />
            <div className="h-3 bg-[#e2e8f0] rounded w-[70%] [animation:pulse_1.5s_infinite]" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 transition-colors duration-200 active:bg-black/[0.03]">
          <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
            <div className="w-[54px] h-[54px] rounded-full bg-[#e2e8f0] flex-shrink-0 relative overflow-hidden">
              {!imgLoaded && <div className="absolute inset-0 [animation:pulse_1.5s_infinite]" />}
              <img
                src={getProxiedUrl(profile.profilePicUrl)}
                alt={acc.username}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full rounded-full object-cover border border-[#efefef] transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-[14px] font-bold text-text-main truncate">{acc.desc}</span>
              <span className="text-[12px] text-text-hint truncate">@{acc.username}</span>
            </div>
          </div>
          <button
            className="flex-shrink-0 min-w-[64px] flex items-center justify-center gap-1 h-7 px-2.5 border-none bg-primary/10 rounded-full text-primary text-[12px] cursor-pointer transition-all duration-150 hover:bg-primary/20 active:bg-primary active:text-white active:scale-95"
            onClick={() => openInsta(acc.username)}
          >
            구경가기
          </button>
        </div>
      )}
    </>
  );
}

function AccountGroup({ groupKey, title, accounts, expanded, onToggle, profiles, getProxiedUrl }) {
  const isExpanded = expanded[groupKey];
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-card overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-3">
      <div
        className="flex justify-between items-center px-4 py-2.5 cursor-pointer transition-colors duration-150 hover:bg-slate-50 select-none"
        onClick={() => onToggle(groupKey)}
      >
        <span className="font-bold text-[16px] tracking-tight text-text-main">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
            {accounts.length}개 계정
          </span>
          <ChevronDown
            size={16}
            className={`text-[#94a3b8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
      <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="accordion-inner border-t border-[#f1f5f9]">
          {accounts.map((acc, idx) => (
            <AccountItem
              key={acc.username}
              acc={acc}
              isFirst={idx === 0}
              profile={profiles[acc.username]}
              getProxiedUrl={getProxiedUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function InstagramListView({ onBack }) {
  const [expanded, setExpanded] = useState({ erica: true, college: true });
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const { profiles, getProxiedUrl } = useInstagram();

  return (
    <div className="pb-20 [animation:slideUp_0.4s_ease-out]">
      <div className="flex items-center gap-4 mb-4">
        <button
          className="w-10 h-10 rounded-card bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer text-text-main transition-all duration-200 hover:bg-surface"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-text-main mb-0">학교 인스타그램</h2>
      </div>

      <AccountGroup groupKey="erica" title="에리카" accounts={INSTA_ACCOUNTS.erica} expanded={expanded} onToggle={toggle} profiles={profiles} getProxiedUrl={getProxiedUrl} />
      <AccountGroup groupKey="college" title="단과대학" accounts={INSTA_ACCOUNTS.college} expanded={expanded} onToggle={toggle} profiles={profiles} getProxiedUrl={getProxiedUrl} />
    </div>
  );
}
