// 컴포넌트: 한양대 ERICA 공식 인스타그램 계정 목록 및 프로필 이미지 표시
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { INSTA_ACCOUNTS, type InstagramAccountInfo, type InstagramProfile } from '../../../domain/entities/InstagramAccount.js';
import { useInstagram } from '../../hooks/useInstagram.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { Accordion } from '../ui/Accordion.js';

type GroupKey = 'erica' | 'college';

const openInsta = (username: string) => {
  const start = Date.now();
  window.location.href = `instagram://user?username=${username}`;
  setTimeout(() => {
    if (Date.now() - start < 2000) {
      window.open(`https://www.instagram.com/${username}/`, '_blank');
    }
  }, 500);
};

interface AccountItemProps {
  acc: InstagramAccountInfo;
  isFirst: boolean;
  profile: InstagramProfile | undefined;
  getProxiedUrl: (originalUrl: string) => string;
}

function AccountItem({ acc, isFirst, profile, getProxiedUrl }: AccountItemProps) {
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
              {profile.profilePicUrl && (
                <>
                  {!imgLoaded && <div className="absolute inset-0 [animation:pulse_1.5s_infinite]" />}
                  <img
                    src={getProxiedUrl(profile.profilePicUrl)}
                    alt={acc.username}
                    onLoad={() => setImgLoaded(true)}
                    className={`w-full h-full rounded-full object-cover border border-[#efefef] transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  />
                </>
              )}
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
            이동하기
          </button>
        </div>
      )}
    </>
  );
}

interface AccountGroupProps {
  groupKey: GroupKey;
  title: string;
  accounts: InstagramAccountInfo[];
  expanded: Record<GroupKey, boolean>;
  onToggle: (key: GroupKey) => void;
  profiles: Record<string, InstagramProfile>;
  getProxiedUrl: (originalUrl: string) => string;
}

function AccountGroup({ groupKey, title, accounts, expanded, onToggle, profiles, getProxiedUrl }: AccountGroupProps) {
  const isExpanded = expanded[groupKey];
  return (
    <Accordion
      isExpanded={isExpanded}
      onToggle={() => onToggle(groupKey)}
      chevronDirection="down"
      header={<span className="font-bold text-[16px] tracking-tight text-text-main">{title}</span>}
    >
      {accounts.map((acc, idx) => (
        <AccountItem
          key={acc.username}
          acc={acc}
          isFirst={idx === 0}
          profile={profiles[acc.username]}
          getProxiedUrl={getProxiedUrl}
        />
      ))}
    </Accordion>
  );
}

interface InstagramViewProps {
  onBack: () => void;
}

export function InstagramView({ onBack }: InstagramViewProps) {
  useBackHandler(onBack);
  const [expanded, setExpanded] = useState<Record<GroupKey, boolean>>({ erica: true, college: true });
  const toggle = (key: GroupKey) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
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
