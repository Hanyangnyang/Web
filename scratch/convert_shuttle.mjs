import fs from 'fs';

// ────────────────────────────────────────────
// 원본 시간표 텍스트
// ────────────────────────────────────────────
const RAW = `
<학기중, 평일, 기숙사>
07시
순환
45
09시
직행
55
10시
예술인
15 45
직행
00 05 10 15 20 25 35 45 55
11시
예술인
15 45
직행
10 25 40 55
12시
순환
15 55
직행
05 20 25 35 45
13시
순환
25 55
중앙역
10
직행
15 40 45
14시
순환
30 55
중앙역
10
직행
20 40
15시
순환
25
중앙역
05
예술인
55
직행
15 35 45 55
16시
중앙역
07
예술인
25 55
직행
01 13 19 25 31 37 43 49 55
17시
순환
55
중앙역
07
예술인
25
직행
01 13 19 25 31 37 43 49
18시
순환
25 55
직행
01 07 13 19 35 45
19시
순환
05 15 25 35 45 55
20시
순환
05 15 25 35 45 55
21시
순환
05 15 25 40 55
22시
순환
10 25 40 55

<학기중, 평일, 셔틀콕>
08시
아침 예술인 직행
20 50
아침 직행
00 05 10 15 20 23 26 29 32 35 38 41 45 50 55
09시
아침 예술인 직행
20 50
아침 직행
00 05 10 15 20 23 26 29 32 35 38 41 45 50 55

<학기중, 주말, 기숙사>
08시
순환
45
09시
순환
15 45
10시
순환
15 45
11시
순환
15 45
12시
순환
15 45
13시
순환
15 45
14시
순환
15 45
15시
순환
15 45
16시
순환
15 45
17시
순환
15 45
18시
순환
15 45
19시
순환
15 45
20시
순환
15 45
21시
순환
15 45

<계절학기, 평일, 기숙사>
주말
07시
순환
55
09시
직행
55
10시
예술인
15 45
직행
05 15 25 35 45 55
11시
예술인
15 45
직행
05 15 25 35 45 55
12시
순환
15 55
직행
05 25 35 45
13시
순환
25 55
중앙역
05
직행
15 35 45
14시
순환
25 55
중앙역
05
직행
15 35 45
15시
순환
25
중앙역
05
예술인
55
직행
15 35 45 55
16시
중앙역
05
예술인
25 55
직행
15 25 35 45 55
17시
순환
55
중앙역
05
예술인
25
직행
15 25 35 45
18시
순환
25 55
직행
05 15 35 45
19시
순환
10 25 40 55
20시
순환
10 25 40 55
21시
순환
10 25 40 55

<계절학기, 평일, 셔틀콕>
아침 예술인 직행
20 50
아침 직행
10 15 20 25 30 35 40 45 50 55
09시
아침 예술인
20 50
아침 직행
00 10 20 30 40 50

<계절학기, 주말, 기숙사>
08시
순환
45
09시
순환
15 45
10시
순환
15 45
11시
순환
15 45
12시
순환
15 45
13시
순환
15 45
14시
순환
15 45
15시
순환
15 45
16시
순환
15 45
17시
순환
15 45
18시
순환
15 45
19시
순환
15 45
20시
순환
15 45
21시
순환
15 45

<방학, 평일, 기숙사>
07시
순환
45
08시
순환
15 45
09시
순환
15 45
10시
순환
15 45
11시
순환
15 45
12시
순환
15 45
13시
순환
15 45
14시
순환
15 45
15시
순환
15 45
16시
순환
15 45
17시
순환
15 45
18시
순환
15 45
19시
순환
15 45
20시
순환
15 45
21시
순환
15 45

<방학, 주말, 기숙사>
평일
주말
08시
순환
45
09시
순환
45
10시
순환
45
11시
순환
45
12시
순환
45
13시
순환
45
14시
순환
45
15시
순환
45
16시
순환
45
17시
순환
45
18시
순환
45
19시
순환
45
20시
순환
45
21시
순환
45
`;

// ────────────────────────────────────────────
// 노선명 정규화
// ────────────────────────────────────────────
const ROUTE_MAP = {
  '순환':           '순환',
  '직행':           '직행',
  '예술인':         '예술인직행',
  '중앙역':         '중앙역',
  '아침 직행':      '아침직행',
  '아침 예술인':    '아침예술인',
  '아침 예술인 직행':'아침예술인',
};

const SKIP_LINES = new Set(['평일', '주말']); // 섹션 내 불필요 라인

// ────────────────────────────────────────────
// 파서
// ────────────────────────────────────────────
function parseHeader(line) {
  // <학기중, 평일, 기숙사> → { period, dayType, firstStop }
  const inner = line.slice(1, -1);
  const [period, dayType, firstStop] = inner.split(',').map(s => s.trim());
  return { period, dayType, firstStop };
}

const results = [];
const lines = RAW.split('\n').map(l => l.trim());

let meta = null;       // 현재 섹션 메타
let hour = null;       // 현재 시
let route = null;      // 현재 노선 (정규화된 이름)
let expectMins = false;// 다음 줄이 분 데이터인지

for (const line of lines) {
  if (!line) continue;

  // 섹션 헤더
  if (line.startsWith('<') && line.endsWith('>')) {
    meta = parseHeader(line);
    hour = null;
    route = null;
    expectMins = false;
    // 셔틀콕 출발 섹션은 시 헤더 없이 시작할 수 있어서 08시 기본값
    if (meta.firstStop === '셔틀콕') hour = 8;
    continue;
  }

  if (!meta) continue;

  // 불필요 라인 (평일/주말 단독 등)
  if (SKIP_LINES.has(line) && !/\d+시/.test(line)) continue;

  // 시 헤더 (07시, 08시 ...)
  if (/^\d+시$/.test(line)) {
    hour = parseInt(line);
    route = null;
    expectMins = false;
    continue;
  }

  // 노선명
  if (ROUTE_MAP[line] !== undefined) {
    route = ROUTE_MAP[line];
    expectMins = true;
    continue;
  }

  // 분 데이터 (숫자들로만 구성)
  if (expectMins && /^[\d\s]+$/.test(line) && hour !== null && route !== null) {
    const mins = line.trim().split(/\s+/).map(Number);
    for (const m of mins) {
      const dep = `${String(hour).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      results.push({ route, period: meta.period, dayType: meta.dayType, dep });
    }
    expectMins = false;
    continue;
  }
}

// ────────────────────────────────────────────
// 정렬 & 출력
// ────────────────────────────────────────────
const PERIOD_ORDER = { '학기중': 0, '계절학기': 1, '방학': 2 };
const DAY_ORDER    = { '평일': 0, '주말': 1 };

results.sort((a, b) => {
  const pd = (PERIOD_ORDER[a.period] ?? 9) - (PERIOD_ORDER[b.period] ?? 9);
  if (pd !== 0) return pd;
  const dd = (DAY_ORDER[a.dayType] ?? 9) - (DAY_ORDER[b.dayType] ?? 9);
  if (dd !== 0) return dd;
  return a.dep.localeCompare(b.dep);
});

const outPath = 'public/shuttle_new.json';
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`✅ ${results.length}개 항목 → ${outPath}`);

// 요약
console.log('\n[기간/요일/노선별 편수]');
const summary = {};
results.forEach(r => {
  const k = `${r.period} | ${r.dayType} | ${r.route}`;
  summary[k] = (summary[k] || 0) + 1;
});
Object.entries(summary).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}편`));
