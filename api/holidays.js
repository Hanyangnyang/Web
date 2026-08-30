// API: 법정공휴일 여부만 조회하는 경량 엔드포인트
// 새 지하철 백엔드(/api/v1/subway/schedule)처럼 dayType(WEEKDAY/HOLIDAY)을 프론트가 직접 판정해서
// 요청해야 하는 API를 쓸 때, "오늘이 요일상 주말인지"는 클라이언트가 계산하면 되지만
// "법정공휴일인지"는 외부 API(공공데이터포털)가 필요해 이 엔드포인트를 거쳐야 한다.
import { getHolidays } from './_lib/holidays.js';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).end();

  try {
    const dateParam = req.query.date; // 'YYYY-MM-DD', 생략 시 오늘(KST)
    let yyyymmdd;

    if (typeof dateParam === 'string' && DATE_KEY.test(dateParam)) {
      yyyymmdd = dateParam;
    } else {
      const now = new Date();
      const kstOffset = 9 * 60; // KST is UTC+9
      const nowKst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
      yyyymmdd = `${nowKst.getFullYear()}-${String(nowKst.getMonth() + 1).padStart(2, '0')}-${String(nowKst.getDate()).padStart(2, '0')}`;
    }

    const year = Number(yyyymmdd.slice(0, 4));
    const holidays = await getHolidays(year);
    const isHoliday = holidays.includes(yyyymmdd);

    return res.status(200).json({ date: yyyymmdd, isHoliday });
  } catch (err) {
    console.error('[Holidays API] Fatal error:', err);
    return res.status(500).json({ error: err.message });
  }
}
