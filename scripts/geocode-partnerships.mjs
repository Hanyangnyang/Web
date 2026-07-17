// 제휴 매장 지오코딩 스크립트
// 카카오 로컬 API로 partnerships.json의 매장 좌표를 채운다.
// 자동 검색이 틀리는 매장은 OVERRIDES(카카오맵 place ID)로 고정한다.
//
// 실행: node --env-file=.env scripts/geocode-partnerships.mjs
// 필요 환경변수: KAKAO_REST_API_KEY (.env, gitignore됨)

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REST_KEY = process.env.KAKAO_REST_API_KEY;
if (!REST_KEY) {
  console.error('❌ KAKAO_REST_API_KEY가 없습니다. .env 확인 후 --env-file=.env로 실행하세요.');
  process.exit(1);
}

const JSON_PATH = path.resolve('src/data/partnerships.json');

// 에리카 정문 좌표 — 검색 편향 기준점
const ERICA = { lng: 126.8388, lat: 37.2983 };
const SEARCH_RADIUS_M = 3000;

// 폐업 확인된 매장 — is_active만 끄고 location은 건드리지 않음
const CLOSED = ['양식당', '헤브론', '오토르테', '큰맘할매순대국'];

// 자동 검색이 실패/오매칭됐던 매장 → 검수 완료된 카카오맵 place ID
const OVERRIDES = {
  '더치킨': '1382180055',
  '신선샤브앤칼국수': '798858902',
  '순뼈감': '416148723',
  '예산 닭갈비감자탕': '16631180',
  '동그라미(써클)': '852352148',
  '브리드 복싱앤 크로스핏': '1868062536',
  '앤의 식탁': '1658098449',
  '정직유부초밥': '194041906',
  '쌈&쌈': '1310936788',
  '사리(디저트카페)': '1533399243',
  '스튜디오 나우 필라테스': '1302396856',
  '교반육회비빔밥': '1242036074',
  '워터킹 커피 로스터스': '132825198',
  '북경반점': '117810106',
  '슈퍼스타 코인노래방': '1761560935',
  '한양사 인쇄복사제본': '16098495',
  '계림원 누룽지 통닭': '1796566911',
  '자이카 인도요리': '369489855',
  '벗히얼 크로스핏': '251157274',
  '인더비엣': '947005689', // 자동 매칭이 단원구 지점을 잡음 → 에리카점으로 고정
  '락': '18554087',
};

// 카카오맵에서 확인 불가 — place ID를 알아내기 전까지 자동 매칭 금지 (오매칭 방지)
const MANUAL_PENDING = [];

// 카카오맵에 없어서 주소로 직접 지오코딩하는 매장
const ADDRESS_OVERRIDES = {
  '풍차이야기': '경기 안산시 상록구 성안2길 5', // 네이버 지도 기준 주소
  '밤새': '경기 안산시 상록구 사동 1149-5', // 카카오맵·네이버 미등록, 지번 주소만 확보 (지층)
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function kakaoGet(endpoint, params) {
  const url = new URL(`https://dapi.kakao.com/v2/local/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_KEY}` } });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function searchKeyword(name) {
  const body = await kakaoGet('search/keyword.json', {
    query: name, x: ERICA.lng, y: ERICA.lat, radius: SEARCH_RADIUS_M, sort: 'accuracy',
  });
  return body.documents[0] ?? null;
}

async function searchAddress(address) {
  const body = await kakaoGet('search/address.json', { query: address });
  return body.documents[0] ?? null;
}

// place ID → 카카오맵 페이지의 og 메타에서 이름/주소를 읽고 주소를 좌표로 변환
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
  return {
    matchedName: name,
    latitude: Number(doc.y),
    longitude: Number(doc.x),
    address,
    full_address: doc.address?.address_name ?? address,
  };
}

function distFromGate(lat, lng) {
  const dy = (lat - ERICA.lat) * 111000;
  const dx = (lng - ERICA.lng) * 88000;
  return Math.round(Math.hypot(dx, dy));
}

// Windows 편집기가 붙이는 UTF-8 BOM 제거 후 파싱
const raw = (await readFile(JSON_PATH, 'utf-8')).replace(/^﻿/, '');
const stores = JSON.parse(raw);

const report = { filled: [], closed: [], notFound: [], skipped: [] };

for (const store of stores) {
  // 폐업 처리
  if (CLOSED.includes(store.name)) {
    store.is_active = false;
    report.closed.push(store.name);
    continue;
  }

  if (MANUAL_PENDING.includes(store.name)) {
    store.location = { latitude: null, longitude: null, address: null, full_address: null };
    report.notFound.push(store.name);
    console.log(`  ⏸ ${store.name} — 카카오맵 미확인, 수동 place ID 필요 (좌표 비움)`);
    continue;
  }

  // 이미 좌표가 있으면 유지 (수동 보정분 보호) — 단, OVERRIDES에 오른 매장은 재확정
  if (store.location?.latitude != null && !OVERRIDES[store.name]) {
    report.skipped.push(store.name);
    continue;
  }

  let resolved = null;
  try {
    if (OVERRIDES[store.name]) {
      resolved = await resolvePlaceId(OVERRIDES[store.name]);
    } else if (ADDRESS_OVERRIDES[store.name]) {
      const doc = await searchAddress(ADDRESS_OVERRIDES[store.name]);
      if (doc) resolved = {
        matchedName: store.name,
        latitude: Number(doc.y),
        longitude: Number(doc.x),
        address: doc.road_address?.address_name ?? ADDRESS_OVERRIDES[store.name],
        full_address: doc.address?.address_name ?? null,
      };
    } else {
      const place = await searchKeyword(store.name);
      if (place) resolved = {
        matchedName: place.place_name,
        latitude: Number(place.y),
        longitude: Number(place.x),
        address: place.road_address_name || place.address_name || null,
        full_address: place.address_name || null,
        placeId: place.id,
      };
    }
  } catch (e) {
    console.error(`  ⚠ ${store.name}: ${e.message}`);
  }
  await sleep(120);

  if (!resolved) {
    report.notFound.push(store.name);
    console.log(`  ✗ ${store.name} — 좌표 확보 실패`);
    continue;
  }

  store.location = {
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    address: resolved.address,
    full_address: resolved.full_address,
  };
  report.filled.push({
    store: store.name,
    matched: resolved.matchedName,
    placeId: resolved.placeId ?? OVERRIDES[store.name] ?? null,
    dist: distFromGate(resolved.latitude, resolved.longitude),
    override: !!(OVERRIDES[store.name] || ADDRESS_OVERRIDES[store.name]),
  });
  console.log(`  ✓ ${store.name} → ${resolved.matchedName} (${resolved.address})`);
}

await writeFile(JSON_PATH, JSON.stringify(stores, null, 2) + '\n', 'utf-8');

console.log('\n═══ 결과 요약 ═══');
console.log(`좌표 채움: ${report.filled.length} / 폐업 처리: ${report.closed.length} / 기존 유지: ${report.skipped.length} / 실패: ${report.notFound.length}`);

// ── 검수 리포트 ──
const auto = report.filled.filter((f) => !f.override);

const nameMismatch = auto.filter(
  ({ store, matched }) => !matched.replaceAll(' ', '').includes(store.replaceAll(' ', ''))
);
if (nameMismatch.length) {
  console.log('\n⚠️ 상호명 불일치 (자동 매칭) — 오매칭 검수 필요:');
  nameMismatch.forEach(({ store, matched, dist }) => console.log(`  - "${store}" → "${matched}" (정문에서 ${dist}m)`));
}

const far = report.filled.filter((f) => f.dist > 1500);
if (far.length) {
  console.log('\n⚠️ 정문 1.5km 밖 — 위치가 맞는지 검수 필요:');
  far.forEach(({ store, matched, dist }) => console.log(`  - "${store}" → "${matched}" (${dist}m)`));
}

const byPlace = new Map();
report.filled.forEach((f) => {
  if (!f.placeId) return;
  if (!byPlace.has(f.placeId)) byPlace.set(f.placeId, []);
  byPlace.get(f.placeId).push(f.store);
});
const dups = [...byPlace.values()].filter((names) => names.length > 1);
if (dups.length) {
  console.log('\n⚠️ 서로 다른 매장이 같은 장소로 매칭됨 — 둘 중 하나는 오매칭:');
  dups.forEach((names) => console.log(`  - ${names.join(' / ')}`));
}
if (report.notFound.length) {
  console.log('\n❌ 실패 — 수동 처리 필요:');
  report.notFound.forEach((n) => console.log(`  - ${n}`));
}
