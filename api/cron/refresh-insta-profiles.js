// Vercel Cron (4개월마다 1회): 인스타그램 프로필 사진을 재수집해서, 바뀐 것만
// public/assets/insta-profiles/*.jpg로 커밋한다. 평소 클라이언트는 이 정적 이미지만
// 읽고(useInstagram.ts) 인스타그램에 직접 요청하지 않으므로, 이 잡이 유일한 갱신 경로다.
import * as https from 'https';
import { captureApiError } from '../_lib/sentry.js';

const USERNAMES = [
  'hanyang_erica', 'hanyang_erica_stu', 'hanyang_erica_club_association', 'hyuerica', 'hanyangerica',
  'hyu_lions', 'hyu_soongan_', 'hyu_erica_eng', 'hypharmacy', 'design_hyu',
  'hanyang_gon', 'hyu_mood', 'hyu_computing', 'hyu_e_sports_and_arts_vibe', 'hyu_erica_atc',
];

const GITHUB_REPO = 'Hanyangnyang/Web';
const GITHUB_BRANCH = 'main';
const IMAGE_PATH_PREFIX = 'public/assets/insta-profiles';

// 인스타그램 스크래핑 방지를 우회하는 브라우저 위장 헤더 + 재시도 로직
const fetchWithRetry = (username, retries = 3) => {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'x-ig-app-id': '936619743392459',
        'Accept': '*/*',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Referer': `https://www.instagram.com/${username}/`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    };

    const performFetch = (attempt) => {
      https.get(apiUrl, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const user = json.data?.user;
              if (user) {
                return resolve(user.profile_pic_url_hd || user.profile_pic_url);
              }
            } catch (e) {}
          }
          if (attempt < retries) {
            setTimeout(() => performFetch(attempt + 1), 1000 * (attempt + 1));
          } else {
            reject(new Error(`Instagram API status ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        if (attempt < retries) {
          setTimeout(() => performFetch(attempt + 1), 1000 * (attempt + 1));
        } else {
          reject(err);
        }
      });
    };

    performFetch(0);
  });
};

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Image download failed: ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function githubApi(path, options = {}) {
  return fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
}

// GitHub Contents API에서 기존 파일의 sha/내용을 가져옴. 없으면(신규 계정 등) null
async function getExistingFile(filePath) {
  const res = await githubApi(`/contents/${filePath}?ref=${GITHUB_BRANCH}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${filePath} failed: ${res.status}`);
  const json = await res.json();
  return { sha: json.sha, buffer: Buffer.from(json.content, 'base64') };
}

// 바뀐 것만 커밋하기 위한 순수 비교 함수 (유닛 테스트 대상)
export function shouldCommit(existingBuffer, newBuffer) {
  if (!existingBuffer) return true;
  return !existingBuffer.equals(newBuffer);
}

async function commitFile(filePath, buffer, sha) {
  const res = await githubApi(`/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `chore: 인스타 프로필 사진 자동 갱신 (${filePath.split('/').pop()})`,
      content: buffer.toString('base64'),
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${filePath} failed: ${res.status} ${await res.text()}`);
}

async function refreshOne(username) {
  const filePath = `${IMAGE_PATH_PREFIX}/${username}.jpg`;
  const profilePicUrl = await fetchWithRetry(username);
  const newBuffer = await downloadImage(profilePicUrl);
  const existing = await getExistingFile(filePath);

  if (!shouldCommit(existing?.buffer ?? null, newBuffer)) {
    return { username, status: 'unchanged' };
  }

  await commitFile(filePath, newBuffer, existing?.sha);
  return { username, status: 'updated' };
}

export default async function handler(req, res) {
  // Vercel Cron이 호출할 때만 CRON_SECRET을 실어보내므로, 이걸로 임의 호출을 막는다
  // (안 막으면 아무나 이 엔드포인트를 때려서 매번 인스타그램 스크래핑 + GitHub 커밋을 유발할 수 있음)
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const results = await Promise.allSettled(USERNAMES.map(refreshOne));

  const summary = await Promise.all(results.map(async (r, i) => {
    if (r.status === 'fulfilled') return r.value;
    const username = USERNAMES[i];
    await captureApiError(r.reason, { source: 'insta-refresh', username });
    return { username, status: 'failed', error: r.reason?.message };
  }));

  console.log('[refresh-insta-profiles]', JSON.stringify(summary));
  res.status(200).json({ summary });
}
