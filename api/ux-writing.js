import { UX_WRITING_GUIDE } from '../src/devtools/ux-writing/guide.js';

const MODEL = 'gemini-3.1-flash-lite';
const MAX_TEXT_LENGTH = 1200;

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function clean(value, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function firstJsonObject(text) {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('JSON 객체를 찾을 수 없습니다.');

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return text.slice(start, index + 1);
  }
  throw new Error('완성된 JSON 객체를 찾을 수 없습니다.');
}

function parseModelJson(text) {
  const parsed = JSON.parse(firstJsonObject(text));
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
      .filter((item) => item && typeof item.text === 'string' && typeof item.reason === 'string')
      .slice(0, 3)
      .map((item) => ({ text: clean(item.text, 120), reason: clean(item.reason, 240) }))
    : [];

  if (suggestions.length === 0) throw new Error('추천 결과 형식이 올바르지 않습니다.');
  const allowedStatuses = new Set(['consistent', 'mixed', 'inconsistent', 'insufficient']);
  const status = allowedStatuses.has(parsed.toneConsistency?.status)
    ? parsed.toneConsistency.status
    : 'insufficient';
  const summary = clean(parsed.toneConsistency?.summary, 300)
    || '같은 레벨의 문구가 충분하지 않아 톤을 비교하기 어려워요.';

  return {
    suggestions,
    assessment: clean(parsed.assessment, 300),
    improvementNeeded: parsed.improvementNeeded === true,
    toneConsistency: { status, summary },
  };
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: '개발 환경에서만 사용할 수 있어요.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청만 지원합니다.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === '여기에_API_키_입력') {
    return res.status(503).json({ error: '로컬 환경에 GEMINI_API_KEY를 설정해 주세요.' });
  }

  try {
    const body = await readBody(req);
    const currentText = clean(body.currentText, 300);
    if (!currentText) return res.status(400).json({ error: '검토할 문구가 비어 있어요.' });
    const peerTexts = Array.isArray(body.peerTexts)
      ? body.peerTexts.map((text) => clean(text, 180)).filter(Boolean).slice(0, 8)
      : [];

    const prompt = `${UX_WRITING_GUIDE}

아래는 개발 중인 실제 UI에서 선택한 문구와 주변 맥락입니다.

- 현재 문구: ${JSON.stringify(currentText)}
- 원래 문구: ${JSON.stringify(clean(body.originalText, 300))}
- 주변 문구: ${JSON.stringify(clean(body.nearbyText))}
- 같은 DOM 레벨의 다른 컴포넌트 문구: ${JSON.stringify(peerTexts)}
- HTML 요소: ${JSON.stringify(clean(body.tagName, 30))}
- 접근성 이름: ${JSON.stringify(clean(body.ariaLabel, 200))}
- 화면 경로: ${JSON.stringify(clean(body.route, 300))}

현재 문구를 먼저 평가하고, 실제로 고칠 이유가 있는지 엄격하게 판단하세요.
문구가 이미 명확하고 자연스러우며 가이드와 주변 톤에 맞으면 improvementNeeded를 false로 지정하고, assessment에 현재 문구를 유지해도 좋다고 솔직하게 설명하세요.
단지 다른 표현이 가능하다는 이유만으로 개선이 필요하다고 판정하지 마세요.
오탈자, 어색한 표현, 불필요한 길이, 행동의 불명확함, 가이드 위반, 주변 문구와의 톤 불일치가 있을 때만 improvementNeeded를 true로 지정하세요.
같은 DOM 레벨의 다른 문구와 존댓말 단계, 문장 길이, 종결어미, 표현의 친근함이 일치하는지도 검사하세요.
비교할 문구가 없거나 성격이 너무 달라 판단하기 어려우면 status를 insufficient로 지정하세요.
그런 다음 이 UI에서 실제로 비교해 볼 대체 문구를 정확히 3개 제안하세요.
세 후보는 각각 ① 가장 일관된 문구 ② 가장 간결한 문구 ③ 가장 친근한 문구 순서로 작성하세요.
주변 맥락에 없는 사실이나 기능을 새로 만들지 마세요.

다음 JSON 형식만 출력하세요:
{
  "assessment": "현재 문구에 대한 짧은 평가",
  "improvementNeeded": true 또는 false,
  "toneConsistency": {
    "status": "consistent | mixed | inconsistent | insufficient 중 하나",
    "summary": "같은 레벨 문구와 비교한 근거"
  },
  "suggestions": [
    { "text": "추천 문구", "reason": "추천 이유" },
    { "text": "추천 문구", "reason": "추천 이유" },
    { "text": "추천 문구", "reason": "추천 이유" }
  ]
}

improvementNeeded가 false여도 UI 비교를 위한 후보 3개는 제공하세요.
그때 첫 번째 후보는 현재 문구를 그대로 사용하고, reason에 유지하는 이유를 적으세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 1200, responseMimeType: 'application/json' },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('UX Writing Gemini request failed:', response.status, detail.slice(0, 500));
      return res.status(502).json({ error: 'AI 추천 요청에 실패했어요.' });
    }

    const data = await response.json();
    const generated = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generated) return res.status(502).json({ error: 'AI가 추천 문구를 반환하지 않았어요.' });

    return res.status(200).json(parseModelJson(generated));
  } catch (error) {
    console.error('UX Writing API error:', error);
    return res.status(500).json({ error: '추천 결과를 처리하지 못했어요.' });
  }
}
