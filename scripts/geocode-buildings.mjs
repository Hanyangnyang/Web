// 캠퍼스 건물 지오코딩 스크립트
// 카카오 로컬 API로 campusBuildings.json의 건물 좌표(위도·경도)를 채운다.
//
// 실행: node --env-file=.env scripts/geocode-buildings.mjs
// 필요 환경변수: KAKAO_REST_API_KEY (.env, gitignore됨)

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REST_KEY = process.env.KAKAO_REST_API_KEY;
if (!REST_KEY) {
  console.error('❌ KAKAO_REST_API_KEY가 없습니다. .env 확인 후 --env-file=.env로 실행하세요.');
  process.exit(1);
}

const JSON_PATH = path.resolve('public/campusBuildings.json');

// 에리카 정문 좌표 — 검색 편향 기준점
const ERICA = { lng: 126.8388, lat: 37.2983 };
const SEARCH_RADIUS_M = 3000;

// 자동 검색이 실패/오매칭될 경우 → 검수 완료된 카카오맵 place ID
const OVERRIDES = {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function kakaoGet(endpoint, params) {
  const url = new URL(`https://dapi.kakao.com/v2/local/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_KEY}` } });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function searchKeyword(query) {
  const body = await kakaoGet('search/keyword.json', {
    query, x: ERICA.lng, y: ERICA.lat, radius: SEARCH_RADIUS_M, sort: 'accuracy',
  });
  return body.documents[0] ?? null;
}

async function searchAddress(address) {
  const body = await kakaoGet('search/address.json', { query: address });
  return body.documents[0] ?? null;
}

async function resolvePlaceId(id) {
  const res = await fetch(`https://place.map.kakao.com/${id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const html = await res.text();
  const meta = (prop) => html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`))?.[1] ?? null;
  const name = meta('og:title');
  const address = meta('og:description');
  if (!address) throw new Error(`place ${id}: og 메타에서 주소를 못 읽음`);
  const doc = await searchAddress(address);
  if (!doc) throw new Error(`place ${id}: 주소 지오코딩 실패 (${address})`);
  return { matchedName: name, latitude: Number(doc.y), longitude: Number(doc.x) };
}

function distFromGate(lat, lng) {
  const dy = (lat - ERICA.lat) * 111000;
  const dx = (lng - ERICA.lng) * 88000;
  return Math.round(Math.hypot(dx, dy));
}

// Windows 편집기가 붙이는 UTF-8 BOM 제거 후 파싱
const raw = (await readFile(JSON_PATH, 'utf-8')).replace(/^﻿/, '');
const items = JSON.parse(raw);

const report = { filled: [], skipped: [], notFound: [] };

for (const item of items) {
  const { latitude, longitude } = item.coordinates ?? {};
  if (latitude !== 0 || longitude !== 0) {
    report.skipped.push(item.name);
    continue;
  }

  const query = `한양대학교 ERICA캠퍼스 ${item.name}`;
  let resolved = null;
  try {
    if (OVERRIDES[item.name]) {
      resolved = await resolvePlaceId(OVERRIDES[item.name]);
    } else {
      const place = await searchKeyword(query);
      if (place) resolved = {
        matchedName: place.place_name,
        latitude: Number(place.y),
        longitude: Number(place.x),
        address: place.road_address_name || place.address_name || null,
      };
    }
  } catch (e) {
    console.error(`  ⚠ ${item.name}: ${e.message}`);
  }
  await sleep(120);

  if (!resolved) {
    report.notFound.push(item.name);
    console.log(`  ✗ ${item.name} — 좌표 확보 실패`);
    continue;
  }

  item.coordinates = { latitude: resolved.latitude, longitude: resolved.longitude };
  report.filled.push({
    name: item.name,
    matched: resolved.matchedName,
    dist: distFromGate(resolved.latitude, resolved.longitude),
  });
  console.log(`  ✓ ${item.name} → ${resolved.matchedName} (${resolved.address ?? ''})`);
}

await writeFile(JSON_PATH, JSON.stringify(items, null, 2) + '\n', 'utf-8');

console.log('\n═══ 결과 요약 ═══');
console.log(`좌표 채움: ${report.filled.length} / 기존 유지(흡연장 등): ${report.skipped.length} / 실패: ${report.notFound.length}`);

// ── 검수 리포트 ──
const nameMismatch = report.filled.filter(
  ({ name, matched }) => !matched.replaceAll(' ', '').includes(name.replaceAll(' ', ''))
);
if (nameMismatch.length) {
  console.log('\n⚠️ 상호명 불일치 — 오매칭 검수 필요:');
  nameMismatch.forEach(({ name, matched, dist }) => console.log(`  - "${name}" → "${matched}" (정문에서 ${dist}m)`));
}

const far = report.filled.filter((f) => f.dist > 1500);
if (far.length) {
  console.log('\n⚠️ 정문 1.5km 밖 — 위치가 맞는지 검수 필요:');
  far.forEach(({ name, matched, dist }) => console.log(`  - "${name}" → "${matched}" (${dist}m)`));
}

if (report.notFound.length) {
  console.log('\n❌ 실패 — 수동 처리 필요:');
  report.notFound.forEach((n) => console.log(`  - ${n}`));
}
