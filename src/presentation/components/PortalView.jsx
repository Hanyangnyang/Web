import React, { useMemo } from 'react';
import { Sparkles, CloudRain, Wind, Sun, Info, Users, Heart } from 'lucide-react';
import { usePortalData } from '../hooks/usePortalData.js';

const FALLBACK_MESSAGES = [
  { title: "오늘의 한 마디", text: "무언가 새로 시작하기 딱 좋은 날입니다! 자신감을 가지세요.", icon: Sparkles, color: "linear-gradient(135deg, #0E4A84 0%, #1a74c7 100%)" },
  { title: "오늘의 행운", text: "생각지도 못했던 곳에서 기분 좋은 소식이 들려올 수 있는 하루입니다.", icon: Sparkles, color: "linear-gradient(135deg, #059669 0%, #10b981 100%)" },
  { title: "오늘의 다짐", text: "가끔은 여유를 가지고 하늘을 올려다보는 것도 좋습니다. 숨을 크게 쉬어보세요.", icon: Info, color: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" },
  { title: "오늘의 운세", text: "작은 친절이 큰 기쁨으로 돌아오는 날입니다. 따뜻한 하루 보내세요.", icon: Heart, color: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)" },
  { title: "오늘의 조언", text: "모든 일에는 타이밍이 있습니다. 서두르지 말고 차분히 나아가세요.", icon: Info, color: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)" },
  { title: "오늘의 한 마디", text: "당신의 묵묵한 노력이 곧 빛을 발할 거예요. 오늘도 힘차게 화이팅!", icon: Users, color: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" },
];

export function PortalView() {
  const { weather, library, loading } = usePortalData();

  const fallback = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return FALLBACK_MESSAGES[seed % FALLBACK_MESSAGES.length];
  }, []);

  const WeatherIcon = useMemo(() => {
    if (!weather) return null;
    const code = weather.weatherCode;
    if (code <= 1) return Sun;
    if (code <= 3) return Sun; // Actually Cloud would be better for 3, but Sun with opacity looks okay
    if (code <= 48) return Wind;
    return CloudRain;
  }, [weather]);

  return (
    <div className="pb-24 [animation:slideUp_0.4s_ease-out]">
      {/* 1. 오늘의 날씨 & 소식 섹션 */}
      <section className="mb-10">
        <h3 className="text-xl font-bold text-text-main mb-4">
          {loading ? '오늘의 날씨' : weather ? '오늘의 날씨' : fallback.title}
        </h2>

        {loading ? (
          <div className="rounded-card min-h-[180px] bg-slate-100 animate-pulse flex flex-col justify-between p-6">
            <div className="flex flex-col gap-3">
              <div className="h-12 w-36 bg-slate-200 rounded-xl" />
              <div className="h-4 w-28 bg-slate-200 rounded-full" />
            </div>
            <div className="h-10 w-full bg-slate-200 rounded-xl mt-6" />
          </div>
        ) : (
        <div className="rounded-card p-6 text-white relative overflow-hidden min-h-[180px] flex flex-col justify-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300" style={{
          background: weather ? 'linear-gradient(135deg, #0E4A84 0%, #1a74c7 100%)' : fallback.color
        }}>
          {weather ? (
            <>
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-black tracking-tight leading-none">{weather.temp}°</span>
                    <span className="text-xl font-bold opacity-90">{weather.description}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold opacity-70 flex items-center gap-1">
                    안산시 상록구 사동
                  </p>
                  
                  <div className="mt-5 bg-white/20 backdrop-blur-lg py-2.5 px-4 rounded-xl inline-flex items-center gap-2.5 text-sm font-bold leading-relaxed max-w-[90%] border border-white/10">
                    {weather.hasPrecipitation ? <CloudRain size={16} strokeWidth={2.5} /> : <Sparkles size={16} strokeWidth={2.5} />}
                    <span className="break-keep">{weather.message}</span>
                  </div>
                </div>
              </div>
              <div className="absolute right-[-15px] top-[-15px] opacity-15 pointer-events-none transform rotate-12">
                {WeatherIcon && <WeatherIcon size={160} />}
              </div>
            </>
          ) : (
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full border border-white/10">
                <fallback.icon size={16} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">Hanyangnyang Pick</span>
              </div>
              <p className="m-0 text-2xl font-black leading-tight break-keep drop-shadow-sm">
                "{fallback.text}"
              </p>
            </div>
          )}

          {weather && weather.airQuality && (
            <div className="grid grid-cols-3 gap-3 mt-8 relative z-10">
              {[
                { label: '미세먼지', data: weather.airQuality.pm10, icon: Wind },
                { label: '초미세', data: weather.airQuality.pm25, icon: Wind },
                { label: '자외선', data: weather.airQuality.uv, icon: Sun }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/95 backdrop-blur-sm rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 shadow-md">
                  <span className="text-[10px] text-text-sub font-black uppercase tracking-widest opacity-80">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <item.icon size={14} color={item.data.color} strokeWidth={3} />
                    <span className="text-[14px] font-black" style={{ color: item.data.color }}>{item.data.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </section>

      {/* 2. 도서관 혼잡도 섹션 */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-text-main mb-4">도서관 혼잡도</h2>
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-card border border-[#e2e8f0] p-5 h-[140px] animate-pulse flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                  <div className="h-6 w-1/2 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full" />
              </div>
            ))
          ) : library?.list ? (
            library.list.map((room) => (
              <div key={room.id} className="bg-white rounded-card border border-[#e2e8f0] p-5 flex flex-col gap-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                <div className="flex flex-col gap-1.5">
                  <span className="font-black text-[0.95rem] text-text-main truncate leading-tight">
                    {room.name.replace(' (2F)', '').replace(' (4F)', '')}
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black w-fit shadow-sm" style={{ 
                    backgroundColor: `${room.color}15`,
                    color: room.color,
                    border: `1px solid ${room.color}20`
                  }}>
                    {room.emoji} {room.status}
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)" style={{ 
                      width: `${room.ratio * 100}%`, 
                      backgroundColor: room.color
                    }} />
                  </div>
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-[11px] text-text-sub font-bold">
                      {room.occupied} / {room.total}
                    </span>
                    <span className="text-[12px] text-text-main font-black">
                      {Math.round(room.ratio * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white rounded-card border border-[#e2e8f0] py-8 flex flex-col items-center gap-2 shadow-sm opacity-80">
              <Info size={20} className="text-text-hint" />
              <p className="text-center text-text-sub text-sm font-semibold">혼잡도 정보를 불러올 수 없습니다</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
