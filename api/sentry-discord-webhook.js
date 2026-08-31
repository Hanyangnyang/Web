// Vercel Serverless Function: Sentry Issue Alert → Discord 웹훅 중계
// Sentry엔 진짜 Discord 연동이 없어서(유료 Slack 연동을 억지로 꽂아 쓰는 방식뿐), Sentry의
// 무료(Developer) 플랜에서도 되는 Internal Integration 웹훅을 받아서 Discord가 원하는 형식으로
// 바꿔 재전송한다.
import * as crypto from 'crypto';

// Vercel의 기본 JSON 바디파서를 끈다 — HMAC 서명 검증은 원본 바이트 그대로 해시해야 하는데,
// 자동 파싱을 거치면 키 순서 등이 바뀌어 서명이 절대 안 맞게 된다.
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Sentry가 sentry-hook-signature 헤더로 보내는 값 = HMAC-SHA256(원본 바디, Client Secret)
export function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signatureHeader, 'utf8');

  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

const LEVEL_COLORS = {
  fatal: 0x9b1c1c,
  error: 0xe03e3e,
  warning: 0xf5a623,
  info: 0x4a90d9,
};

// 프론트가 Sentry.captureException(error, { tags }) 로 직접 붙이는 태그 중, 어디서 터졌는지 알아내는 데
// 실제로 쓸모있는 것들만 Discord에 노출한다 — 에러 종류에 따라 이 중 일부만 존재한다
// (예: ErrorBoundary가 잡은 렌더 크래시 → boundary만, API 검증 실패 → area+endpoint(+queryKey/mutationKey))
const RELEVANT_TAGS = [
  ['boundary', 'boundary'],   // 어느 ErrorBoundary가 잡았는지 (예: weather-alarm-settings)
  ['area', 'area'],           // 어느 기능/API인지 한글 이름표 (예: 학식, 셔틀 시간표)
  ['endpoint', 'endpoint'],   // 실제로 요청이 나간 URL
  ['queryKey', 'queryKey'],   // 실패한 TanStack Query의 쿼리 키
  ['mutationKey', 'mutationKey'], // 실패한 TanStack Mutation의 키
];

// Sentry 웹훅의 tags는 [key, value] 쌍의 배열로 온다 — 그중 RELEVANT_TAGS에 있고 실제로 존재하는 것만 뽑는다
function extractRelevantTagFields(tags) {
  if (!Array.isArray(tags)) return [];
  const tagMap = new Map(tags);
  return RELEVANT_TAGS
    .filter(([key]) => tagMap.has(key))
    .map(([key, label]) => ({ name: label, value: String(tagMap.get(key)).slice(0, 1024), inline: true }));
}

// Sentry Issue Alert 웹훅 페이로드 → Discord 웹훅 메시지 형식 변환 (순수 함수, 유닛 테스트 대상)
export function buildDiscordPayload(sentryPayload) {
  const event = sentryPayload?.data?.event ?? {};
  const level = event.level || 'error';
  const title = event.title || '(제목 없음)';

  return {
    embeds: [
      {
        title: String(title).slice(0, 256),
        url: event.web_url,
        description: event.culprit ? `\`${event.culprit}\`` : undefined,
        color: LEVEL_COLORS[level] ?? LEVEL_COLORS.error,
        fields: extractRelevantTagFields(event.tags),
      },
    ],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!process.env.DISCORD_WEBHOOK_URL) {
    return res.status(500).send('DISCORD_WEBHOOK_URL is not configured');
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['sentry-hook-signature'];

  if (!verifySignature(rawBody, signature, process.env.SENTRY_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Internal Integration은 이슈 알림(event_alert) 말고도 설치/삭제 같은 라이프사이클 이벤트도
  // 같은 웹훅으로 보낸다 — issue alert만 처리하고 나머지는 조용히 무시
  if (req.headers['sentry-hook-resource'] !== 'event_alert') {
    return res.status(200).send('ignored');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const discordRes = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildDiscordPayload(payload)),
  });

  if (!discordRes.ok) {
    console.error('[sentry-discord-webhook] Discord POST failed:', discordRes.status, await discordRes.text());
    return res.status(502).send('Discord webhook failed');
  }

  return res.status(200).send('ok');
}
