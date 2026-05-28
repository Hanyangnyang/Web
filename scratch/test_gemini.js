import fs from 'fs';
import path from 'path';

// Manual simple env parsing
let geminiKey = '';
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
  if (match) {
    geminiKey = match[1].trim().replace(/['"]/g, '');
  }
} catch (e) {
  console.log('No .env file found, trying process.env');
  geminiKey = process.env.GEMINI_API_KEY || '';
}

console.log('Gemini Key length:', geminiKey ? geminiKey.length : 0);

const prompt = `너는 날씨 앱의 AI 어시스턴트야. 아래 날씨 데이터와 [현재 시간대] 정보를 바탕으로 한국 대학생에게 친근하고 자연스러운 한국어로 오늘 날씨 코멘트를 한 문장으로 작성해줘.

현재 시간대: 낮/활동 시간대 (15시)
맥락 가이드: 활기찬 낮 일과 중 조언과 함께 자외선, 미세먼지 등 실외 활동 대비 요령을 조언해줘.

현재 기온: 28°C (오늘 최고 29°C / 최저 20°C)
날씨 상태: 흐림
미세먼지: 좋음 / 초미세먼지: 좋음 / 자외선: 낮음
현재 강수 여부: 없음
오늘 중 비/눈 예보 여부: 있음 (우산을 꼭 챙기도록 친근하게 조언해줘)

규칙:
- 40자 이내로 간결하게
- 실용적인 조언(외투, 우산, 자외선차단제 등)을 자연스럽게 포함
- 이모지 사용 금지
- 반말 금지, 친근한 존댓말 사용
- 문장 부호로만 끝낼 것 (마침표 또는 느낌표)
- 오직 코멘트 문장만 출력, 다른 말 하지 말 것`;

async function test() {
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.8 }
        })
      }
    );

    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      console.log('Response:', JSON.stringify(geminiData, null, 2));
      const generated = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log('Generated:', generated);
    } else {
      console.log('Error status:', geminiRes.status);
      console.log('Error text:', await geminiRes.text());
    }
  } catch (e) {
    console.error(e);
  }
}

test();
