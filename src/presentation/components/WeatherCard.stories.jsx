import { WeatherCard } from './WeatherCard.jsx';
import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudRain, Snowflake, CloudDrizzle, CloudLightning } from 'lucide-react';

// ── mock 데이터 생성기 ─────────────────────────────────────────────
// 시간별 예보는 현재 시각 기준 ±12시간으로 생성 — 고정 epoch를 쓰면
// 시간이 지날수록 렌더 창(±12h) 밖으로 벗어나 스트립이 비어버린다.

function makeHourlyForecast(weatherCode, baseTemp) {
  const now = Date.now();
  const currentHourEpoch = Math.floor(now / 3600000) * 3600000;
  return Array.from({ length: 24 }, (_, i) => {
    const epoch = currentHourEpoch + (i - 11) * 3600000;
    return {
      epoch,
      time: new Date(epoch).toISOString(),
      hour: new Date(epoch).getHours(),
      temp: baseTemp + Math.round(3 * Math.sin(i / 3)),
      precipProb: weatherCode >= 61 ? 60 : 0,
      weatherCode,
    };
  });
}

// api/portal.js getAQILabel과 동일한 등급 체계
const AQ_GRADES = {
  좋음: { label: '좋음', color: '#2563eb', level: 1 },
  보통: { label: '보통', color: '#4ade80', level: 2 },
  나쁨: { label: '나쁨', color: '#ef4444', level: 3 },
  매우나쁨: { label: '매우나쁨', color: '#991b1b', level: 4 },
  점검중: { label: '점검중', color: '#94a3b8', level: 1 },
};

function makeWeather({ weatherCode, temp, description, grade = AQ_GRADES.보통 }) {
  return {
    temp,
    description,
    weatherCode,
    message: '오늘도 좋은 하루 보내세요! 산책하기 좋은 날씨예요.',
    isAiMessage: true,
    hasPrecipitation: weatherCode >= 61,
    hourlyForecast: makeHourlyForecast(weatherCode, temp),
    airQuality: { pm10: grade, pm25: grade, uv: grade },
  };
}

// WeatherCard.jsx weatherTheme 분기와 1:1 대응하는 배경 6종
const BACKGROUNDS = [
  { name: '폭염 맑음 (28°↑ 골드오렌지)', weatherCode: 0, temp: 31, description: '맑음' },
  { name: '선선한 맑음 (스카이블루)', weatherCode: 0, temp: 21, description: '맑음' },
  { name: '구름 조금 (소프트블루)', weatherCode: 2, temp: 24, description: '구름 조금' },
  { name: '흐림 (클라우드그레이)', weatherCode: 3, temp: 18, description: '흐림' },
  { name: '눈 (화이트스카이)', weatherCode: 71, temp: -2, description: '눈' },
  { name: '비·뇌우 (딥스톰퍼플)', weatherCode: 63, temp: 15, description: '비' },
];

export default {
  title: '소식탭/WeatherCard',
  component: WeatherCard,
  // 주의: 여기(meta)에 decorators를 걸면 스토리별 decorators와 "대체"가 아니라
  // "중첩"되어 모든 스토리에 항상 함께 적용된다. 전체매트릭스처럼 폭이 달라야
  // 하는 스토리가 있어서, 모바일 프레임은 개별 스토리(mobileFrame)에서만 부여한다.
};

// 실제 앱 화면(iPhone SE/8 기준) 날씨 카드 폭 — 개별 스토리·매트릭스 열 폭에 공통 사용
const CARD_WIDTH = 375;

// 실제 앱과 동일한 모바일 폭에서 검수하기 위한 개별 스토리용 decorator
const mobileFrame = (Story) => (
  <div style={{ maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', paddingTop: '16px' }}>
    <Story />
  </div>
);

// Storybook 사이드바는 기본적으로 export 순서를 그대로 따른다.
// 전체 조합 검수(전체매트릭스) → 아이콘 전수 비교(아이콘모음) → 개별 상태 순으로 배치.

// ── 전체 매트릭스: 배경 6종(행) × 미세먼지 등급 5종(열) = 30조합 표 형태 ─────
// 열 개수(라벨 1 + 등급 5 = 6)와 gridTemplateColumns 칸 수를 맞춰뒀기 때문에,
// 아래 flatMap이 만드는 평평한 배열이 자동으로 "배경별 한 줄"로 줄바꿈된다.
const GRADE_LIST = Object.values(AQ_GRADES);

export const 전체매트릭스 = {
  render: () => (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `120px repeat(${GRADE_LIST.length}, ${CARD_WIDTH}px)`,
          gap: '10px 12px',
          alignItems: 'center',
        }}
      >
        {/* 헤더 행: 등급 이름 */}
        <div />
        {GRADE_LIST.map((grade) => (
          <div key={`head-${grade.label}`} style={{ fontSize: '13px', fontWeight: 800, textAlign: 'center', color: '#334155' }}>
            {grade.label}
          </div>
        ))}

        {/* 배경별 한 줄: 라벨 + 등급 5개 카드 */}
        {BACKGROUNDS.flatMap((bg) => [
          <div key={`${bg.name}-label`} style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
            {bg.name}
          </div>,
          ...GRADE_LIST.map((grade) => (
            <WeatherCard key={`${bg.name}-${grade.label}`} weather={makeWeather({ ...bg, grade })} loading={false} />
          )),
        ])}
      </div>
    </div>
  ),
};

// ── 시간별 예보 아이콘 모음: getHourlyIcon/getHourlyIconFill 분기 전수 나열 ─────
const HOURLY_ICONS = [
  { Icon: Moon, name: 'Moon', fill: 'none', when: 'code ≤0 · 야간(20~06시)' },
  { Icon: Sun, name: 'Sun', fill: 'none', when: 'code ≤0 · 주간' },
  { Icon: CloudMoon, name: 'CloudMoon', fill: '#ffffff', when: 'code ≤1 · 야간' },
  { Icon: CloudSun, name: 'CloudSun', fill: '#ffffff', when: 'code ≤1(주간) 또는 code=2' },
  { Icon: Cloud, name: 'Cloud', fill: '#ffffff', when: 'code ≤3' },
  { Icon: CloudFog, name: 'CloudFog', fill: '#ffffff', when: 'code ≤48 (안개)' },
  { Icon: CloudRain, name: 'CloudRain', fill: '#ffffff', when: 'code ≤67 (비)' },
  { Icon: Snowflake, name: 'Snowflake', fill: 'none', when: 'code ≤77 (눈) — CloudRain과 구분되는 구름 없는 눈송이' },
  { Icon: CloudDrizzle, name: 'CloudDrizzle', fill: '#ffffff', when: 'code ≤82 (소나기)' },
  { Icon: CloudLightning, name: 'CloudLightning', fill: '#ffffff', when: 'code >82 (뇌우)' },
];

// 실제 카드의 시간별 예보 칸(WeatherCard.jsx L333-347)과 동일한 마크업 재현.
// isCurrent(지금 칸)일 때만 배경이 bg-white/90 필로 바뀌고, 아이콘 테두리 색이
// text-white → text-black으로 반전된다 — fill(내부 채움색)은 두 상태에서 동일하다.
function HourlyPill({ Icon, fill, isCurrent }) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 px-2.5 py-0.5 rounded-xl transition-all duration-300 ${
        isCurrent ? 'bg-white/90 border border-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]' : ''
      }`}
      style={{ minWidth: '46px' }}
    >
      <span className={`text-[11px] font-bold ${isCurrent ? 'text-slate-700 font-extrabold' : 'text-white'}`}>3시</span>
      <Icon size={16} strokeWidth={2} fill={fill} className={`my-0.5 ${isCurrent ? 'text-black' : 'text-white'} weather-rain-icon`} />
      <span className={`text-[13px] font-black ${isCurrent ? 'text-slate-800' : 'text-white'}`}>21°</span>
    </div>
  );
}

export const 아이콘모음 = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {HOURLY_ICONS.map(({ Icon, name, fill, when }) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 아이콘 라벨 + 실제 적용되는 fill 색상 */}
          <div style={{ width: '260px', flexShrink: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#334155', margin: 0 }}>{name}</p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>{when}</p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
              fill: <code>{fill}</code>
            </p>
          </div>

          {/* 실제 카드 배경(비·뇌우 그라데이션) 위에서 비활성/활성 두 상태 나란히 비교 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <HourlyPill Icon={Icon} fill={fill} isCurrent={false} />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>비활성 (text-white)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <HourlyPill Icon={Icon} fill={fill} isCurrent={true} />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>활성 · 지금 (text-black)</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

// ── 배경 6종 개별 스토리 (미세먼지: 보통) ──────────────────────────
export const 폭염맑음 = { decorators: [mobileFrame], args: { weather: makeWeather(BACKGROUNDS[0]), loading: false } };
export const 선선한맑음 = { decorators: [mobileFrame], args: { weather: makeWeather(BACKGROUNDS[1]), loading: false } };
export const 구름조금 = { decorators: [mobileFrame], args: { weather: makeWeather(BACKGROUNDS[2]), loading: false } };
export const 흐림 = { decorators: [mobileFrame], args: { weather: makeWeather(BACKGROUNDS[3]), loading: false } };
export const 눈 = { decorators: [mobileFrame], args: { weather: makeWeather(BACKGROUNDS[4]), loading: false } };
export const 비뇌우 = { decorators: [mobileFrame], args: { weather: makeWeather(BACKGROUNDS[5]), loading: false } };

export const 로딩스켈레톤 = { decorators: [mobileFrame], args: { weather: null, loading: true } };
