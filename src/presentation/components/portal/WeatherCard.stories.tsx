import type { ComponentType } from 'react';
import { WeatherCard } from './WeatherCard.jsx';
import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, Snowflake, CloudDrizzle, type LucideIcon } from 'lucide-react';
import type { Weather, HourlyForecast, WeatherCondition, PmGrade } from '../../../domain/entities/Weather.js';
import type { WeatherBriefing } from '../../../domain/entities/WeatherBriefing.js';

// ── mock 데이터 생성기 ─────────────────────────────────────────────
// 시간별 예보는 현재 시각 기준으로 생성한다 — 고정 epoch를 쓰면 시간이 지날수록
// 카드의 렌더 창(지금 ~ +12시간) 밖으로 벗어나 스트립이 비어버린다.

const currentHourEpoch = () => Math.floor(Date.now() / 3600000) * 3600000;

function makeHourly(condition: WeatherCondition, baseTemp: number): HourlyForecast[] {
  const base = currentHourEpoch();
  // 지금 칸 + 앞으로 12시간 = 13칸
  return Array.from({ length: 13 }, (_, i) => ({
    epoch: base + i * 3600000,
    temp: baseTemp + Math.round(3 * Math.sin(i / 3)),
    condition,
    precipProb: condition === 'RAIN' || condition === 'SHOWER' ? 60 : 0,
  }));
}

interface MakeWeatherArgs {
  condition: WeatherCondition;
  temp: number;
  pmGrade?: PmGrade | null; // null = 점검중
}

function makeWeather({ condition, temp, pmGrade = '보통' }: MakeWeatherArgs): Weather {
  return {
    current: {
      epoch: currentHourEpoch(),
      temp,
      condition,
      maxTemp: temp + 4,
      minTemp: temp - 5,
      pm10Grade: pmGrade,
      pm25Grade: pmGrade,
      uvGrade: '보통',
    },
    hourly: makeHourly(condition, temp),
  };
}

const BRIEFING: WeatherBriefing = {
  content: '오늘도 좋은 하루 보내세요! 산책하기 좋은 날씨예요.',
};

// weatherTheme의 배경 분기와 1:1 대응하는 6종
// (한파는 별도 배경/아이콘 없이 기온(-10°↓)에 따라 기존 카드 위에 "한파" 뱃지만 얹는 방식)
const BACKGROUNDS: { name: string; condition: WeatherCondition; temp: number }[] = [
  { name: '폭염 맑음 (28°↑ 골드오렌지)', condition: 'SUNNY', temp: 31 },
  { name: '선선한 맑음 (스카이블루)', condition: 'SUNNY', temp: 21 },
  { name: '구름많음 (소프트블루)', condition: 'MOSTLY_CLOUDY', temp: 24 },
  { name: '흐림 (클라우드그레이)', condition: 'CLOUDY', temp: 18 },
  { name: '눈 (화이트스카이)', condition: 'SNOW', temp: -2 },
  { name: '비 (딥스톰퍼플)', condition: 'RAIN', temp: 15 },
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
const mobileFrame = (Story: ComponentType) => (
  <div style={{ maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', paddingTop: '16px' }}>
    <Story />
  </div>
);

// Storybook 사이드바는 기본적으로 export 순서를 그대로 따른다.
// 전체 조합 검수(전체매트릭스) → 아이콘 전수 비교(아이콘모음) → 개별 상태 순으로 배치.

// ── 전체 매트릭스: 배경 6종(행) × [미세먼지 등급 4종 + 점검중 + 한파] 6열 = 36조합 표 형태 ─────
// 열 개수(라벨 1 + 6 = 7)와 gridTemplateColumns 칸 수를 맞춰뒀기 때문에,
// 아래 flatMap이 만드는 평평한 배열이 자동으로 "배경별 한 줄"로 줄바꿈된다.
// 마지막 "한파" 열은 COLD_SNAP_TEMP(-10°)보다 낮은 기온으로 덮어써서
// 별도 배경 없이 각 날씨 카드 위에 "한파" 뱃지만 얹히는지 한 번에 검수한다.
interface MatrixColumn {
  key: string;
  label: string;
  grade: PmGrade | null;
  coldSnapTemp?: number;
}

const PM_GRADES: (PmGrade | null)[] = ['좋음', '보통', '나쁨', '매우나쁨', null];

const MATRIX_COLUMNS: MatrixColumn[] = [
  ...PM_GRADES.map((grade) => ({ key: grade ?? '점검중', label: grade ?? '점검중', grade })),
  { key: '한파', label: '한파', grade: '보통', coldSnapTemp: -13 },
];

export const 전체매트릭스 = {
  render: () => (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `120px repeat(${MATRIX_COLUMNS.length}, ${CARD_WIDTH}px)`,
          gap: '10px 12px',
          alignItems: 'center',
        }}
      >
        {/* 헤더 행: 등급 이름 + 한파 */}
        <div />
        {MATRIX_COLUMNS.map((col) => (
          <div key={`head-${col.key}`} style={{ fontSize: '13px', fontWeight: 800, textAlign: 'center', color: '#334155' }}>
            {col.label}
          </div>
        ))}

        {/* 배경별 한 줄: 라벨 + 등급 5개 + 한파 1개 카드 */}
        {BACKGROUNDS.flatMap((bg) => [
          <div key={`${bg.name}-label`} style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
            {bg.name}
          </div>,
          ...MATRIX_COLUMNS.map((col) => (
            <WeatherCard
              key={`${bg.name}-${col.key}`}
              weather={makeWeather({
                condition: bg.condition,
                temp: col.coldSnapTemp !== undefined ? col.coldSnapTemp : bg.temp,
                pmGrade: col.grade,
              })}
              briefing={BRIEFING}
              loading={false}
            />
          )),
        ])}
      </div>
    </div>
  ),
};

// ── 시간별 예보 아이콘 모음: getHourlyIcon/getHourlyIconFill 분기 전수 나열 ─────
const HOURLY_ICONS = [
  { Icon: Sun, name: 'Sun', fill: 'none', when: 'SUNNY · 주간' },
  { Icon: Moon, name: 'Moon', fill: 'none', when: 'SUNNY · 야간(20~06시)' },
  { Icon: CloudSun, name: 'CloudSun', fill: '#ffffff', when: 'MOSTLY_CLOUDY · 주간' },
  { Icon: CloudMoon, name: 'CloudMoon', fill: '#ffffff', when: 'MOSTLY_CLOUDY · 야간' },
  { Icon: Cloud, name: 'Cloud', fill: '#ffffff', when: 'CLOUDY · 상태를 모를 때(null)의 기본값이기도 함' },
  { Icon: CloudRain, name: 'CloudRain', fill: '#ffffff', when: 'RAIN · RAIN_SNOW' },
  { Icon: Snowflake, name: 'Snowflake', fill: 'none', when: 'SNOW — CloudRain과 구분되는 구름 없는 눈송이' },
  { Icon: CloudDrizzle, name: 'CloudDrizzle', fill: '#ffffff', when: 'SHOWER' },
];

// 실제 카드의 시간별 예보 칸과 동일한 마크업 재현.
// isCurrent(지금 칸)일 때만 배경이 bg-white/90 필로 바뀌고, 아이콘 테두리 색이
// text-white → text-black으로 반전된다 — fill(내부 채움색)은 두 상태에서 동일하다.
interface HourlyPillProps {
  Icon: LucideIcon;
  fill: string;
  isCurrent: boolean;
}

function HourlyPill({ Icon, fill, isCurrent }: HourlyPillProps) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 px-2.5 py-0.5 rounded-xl transition-all duration-300 ${
        isCurrent ? 'bg-white/90 border border-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]' : ''
      }`}
      style={{ minWidth: '48px' }}
    >
      <span className={`text-[11px] font-bold ${isCurrent ? 'text-slate-700 font-extrabold' : 'text-white'}`}>3시</span>
      <Icon size={18} strokeWidth={2} fill={fill} className={`my-0.5 ${isCurrent ? 'text-black' : 'text-white'} weather-rain-icon`} />
      <span className={`text-[14px] font-black ${isCurrent ? 'text-slate-800' : 'text-white'}`}>21°</span>
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

          {/* 실제 카드 배경(비 그라데이션) 위에서 비활성/활성 두 상태 나란히 비교 */}
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
const story = (bg: (typeof BACKGROUNDS)[number]) => ({
  decorators: [mobileFrame],
  args: { weather: makeWeather({ condition: bg.condition, temp: bg.temp }), briefing: BRIEFING, loading: false },
});

export const 폭염맑음 = story(BACKGROUNDS[0]);
export const 선선한맑음 = story(BACKGROUNDS[1]);
export const 구름많음 = story(BACKGROUNDS[2]);
export const 흐림 = story(BACKGROUNDS[3]);
export const 눈 = story(BACKGROUNDS[4]);
export const 비 = story(BACKGROUNDS[5]);

// 브리핑이 아직 안 왔거나 없는 경우 — AI 문구 줄 자체가 빠진다
export const 브리핑없음 = {
  decorators: [mobileFrame],
  args: { weather: makeWeather({ condition: 'SUNNY', temp: 24 }), briefing: null, loading: false },
};

// 서버가 모르는 날씨 상태를 준 경우 — "정보 없음" + 기본 아이콘/배경으로 버틴다
export const 상태알수없음 = {
  decorators: [mobileFrame],
  args: {
    weather: { ...makeWeather({ condition: 'SUNNY', temp: 24 }), current: { ...makeWeather({ condition: 'SUNNY', temp: 24 }).current, condition: null } },
    briefing: BRIEFING,
    loading: false,
  },
};

export const 로딩스켈레톤 = { decorators: [mobileFrame], args: { weather: null, loading: true } };

// 조회 실패 + 캐시된 이전 데이터도 없는 경우. 캐시가 있으면 실패해도 그 데이터를 계속 보여준다.
export const 조회실패 = {
  decorators: [mobileFrame],
  args: { weather: null, loading: false, error: new Error('network error') },
};
