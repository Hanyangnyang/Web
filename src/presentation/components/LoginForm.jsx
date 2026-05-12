// 컴포넌트: 한양대 포털 ID/PW 입력 로그인 폼
import React, { useState } from 'react';

const inputClass = "w-full bg-white border border-[#e2e8f0] rounded-card px-4 py-[0.875rem] text-text-main text-base transition-all duration-200 font-[inherit] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,74,132,0.2)]";

export function LoginForm({ onSuccess }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) return;
    setStatus('loading');
    setErrMsg('');
    try {
      await onSuccess({ loginId, password });
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Login failed');
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-card p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] [animation:slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)]">
      <h1 className="text-2xl font-bold text-center mb-2 text-primary">
        HYU 학술정보관
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-sub mb-2 uppercase tracking-[0.05em]">
            포털 아이디
          </label>
          <input
            type="text"
            className={inputClass}
            value={loginId}
            onChange={e => setLoginId(e.target.value)}
            placeholder="포털 아이디"
            required
          />
        </div>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-sub mb-2 uppercase tracking-[0.05em]">
            비밀번호
          </label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="포털 비밀번호"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full mt-6 bg-gradient-to-br from-primary to-[#1e5fa0] text-white border-none rounded-card py-4 text-base font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_0_rgba(14,74,132,0.2)] flex justify-center items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(14,74,132,0.2)] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
          disabled={status === 'loading'}
        >
          {status === 'loading'
            ? <div className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-[spin_0.8s_linear_infinite]" />
            : '로그인 연동하기'}
        </button>
        {status === 'error' && (
          <p className="text-error text-sm text-center mt-4 [animation:shake_0.4s_ease]">{errMsg}</p>
        )}
      </form>
    </div>
  );
}
