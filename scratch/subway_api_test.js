const KEY = '4557506f416b646a33337a7566784c';
const STATION = '한대앞';
const URL = `http://swopenapi.seoul.go.kr/api/subway/${KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(STATION)}`;

try {
  const res = await fetch(URL);
  const data = await res.json();
  if (data.realtimeArrivalList) {
    data.realtimeArrivalList.forEach(t => {
      console.log(`[${t.updnLine} / ${t.bstatnNm}행]`);
      console.log(` - arvlMsg2: ${t.arvlMsg2}`);
      console.log(` - arvlMsg3: ${t.arvlMsg3}`);
      console.log(` - barvlDt: ${t.barvlDt}초`);
      console.log('---');
    });
  }
} catch (e) { console.error(e); }
