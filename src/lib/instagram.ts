// 인스타그램 딥링크 및 웹 폴백 처리 유틸리티

/**
 * 주어진 문자열이 인스타그램 URL 또는 스킴인지 판별합니다.
 */
export const isInstagramUrl = (url: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    /instagram\.com/i.test(trimmed) ||
    /^instagram:\/\//i.test(trimmed) ||
    /^@[a-zA-Z0-9._]+$/.test(trimmed)
  );
};

/**
 * 인스타그램 URL 또는 텍스트에서 계정명(username)을 추출합니다.
 * 프로필이 아닌 게시물/릴스 링크이거나 유효하지 않은 경우 null을 반환합니다.
 */
export const extractInstagramUsername = (input: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. @username 형태
  if (trimmed.startsWith('@')) {
    const raw = trimmed.slice(1).split(/[/?#]/)[0];
    return raw || null;
  }

  // 2. instagram://user?username=xxx 형태
  if (trimmed.startsWith('instagram://')) {
    try {
      const url = new URL(trimmed);
      const username = url.searchParams.get('username');
      if (username) return username;
    } catch {
      const match = trimmed.match(/username=([a-zA-Z0-9._]+)/);
      if (match) return match[1];
    }
  }

  // 3. 웹 URL 형태 (https://www.instagram.com/username/)
  // p/, reel/, stories/, explore/ 등 특정 기능 경로는 프로필이 아니므로 제외
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (/instagram\.com$/i.test(parsed.hostname)) {
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const firstSegment = segments[0];
        const nonUserSegments = ['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'];
        if (!nonUserSegments.includes(firstSegment.toLowerCase())) {
          return firstSegment;
        }
      }
    }
  } catch {
    // URL 파싱 실패 시 단순 정규식 시도
    const match = trimmed.match(/(?:instagram\.com\/)([a-zA-Z0-9._]+)/i);
    if (match && !['p', 'reel', 'stories', 'explore'].includes(match[1].toLowerCase())) {
      return match[1];
    }
  }

  // 4. 공백 없는 단순 아이디 문자열인 경우 (영문, 숫자, 밑줄, 마침표)
  if (/^[a-zA-Z0-9._]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * 인스타그램 계정 프로필 또는 게시물 링크를 엽니다.
 * 계정 프로필인 경우 모바일 앱 스킴(instagram://)을 우선 시도하고, 500ms 내 미전환 시 웹 브라우저로 폴백합니다.
 */
export const openInstagram = (target: string): void => {
  if (!target) return;
  const trimmed = target.trim();
  const username = extractInstagramUsername(trimmed);

  if (username) {
    const start = Date.now();
    // 1. 인스타그램 앱 스킴 호출 (앱 설치 기기인 경우 인스타 앱으로 즉시 전환)
    window.location.href = `instagram://user?username=${username}`;

    // 2. 500ms 후 앱 전환이 일어나지 않았거나 PC/웹 브라우저인 경우 새 창으로 웹 페이지 열기
    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(`https://www.instagram.com/${username}/`, '_blank');
      }
    }, 500);
    return;
  }

  // 프로필 계정명이 아니거나(예: 게시물/릴스 링크), URL 형식인 경우 일반 웹 링크로 열기
  const fallbackUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  window.open(fallbackUrl, '_blank');
};
