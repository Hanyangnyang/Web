import * as cheerio from 'cheerio';

const CAFES = [
  { id: 're12', name: '학생식당' },
  { id: 're15', name: '창업보육센터' },
  { id: 're11', name: '교직원식당' },
  { id: 're13', name: '기숙사식당' }
];

const MEAL_TYPE_KEYWORDS = ['조식', '중식', '석식', '천원'];

// 학식 API: 식당 1곳의 HTML을 긁어서 메뉴 배열로 변환
async function scrapeCafe(cafeId, dateStr) {
  const encodedDate = encodeURIComponent(dateStr);
  // 1. url 조립 
  const url = `https://www.hanyang.ac.kr/web/www/${cafeId}?p_p_id=kr_ac_hanyang_cafe_web_portlet_CafePortlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_kr_ac_hanyang_cafe_web_portlet_CafePortlet_sMenuDate=${encodedDate}&_kr_ac_hanyang_cafe_web_portlet_CafePortlet_action=view`;

  try {
    // 1. fetch 요청
    const fetchRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!fetchRes.ok) return { id: cafeId, menus: [], error: true };

    const html = await fetchRes.text();
    // 2. cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(html); 
    const menus = [];

    // 3. h3 태그를 기준으로 메뉴 섹션을 구분하고, 각 섹션의 메뉴 아이템과 가격을 추출  
    $('h3').each((i, el) => {
      const title = $(el).text().trim();

      // 4. 메뉴 텍스트를 토큰 단위로 쪼개기
      if (title && MEAL_TYPE_KEYWORDS.some(k => title.includes(k))) {
        let menuText = $(el).next().text().replace(/\s+/g, ' ').trim();
        if (menuText && menuText.length > 5 && !menuText.includes('확인 가능합니다')) {
          // [천원의아침밥] 뒤에 띄어쓰기 없으면 강제로 공백 추가
          menuText = menuText.replace(/(\[천원의아침밥\])([^\s])/g, '$1 $2');

          const rawItems = menuText
            .replace(/"/g, '')
            .split(/\s+/)
            .filter(item => !/[a-zA-Z]/.test(item))
            .filter(item => item !== '&') // 단독으로 남은 & 제거
            .filter(item => item.trim().length > 0);

          const parsedSets = [];
          let currentItems = [];

          // 5. 가격 토큰 '원'을 기준으로 세트 분리 
          rawItems.forEach(item => {
            if (/\d+.*원/.test(item)) {
              parsedSets.push({ items: [...currentItems], price: item });
              currentItems = [];
            } else {
              currentItems.push(item);
            }
          });
          if (currentItems.length > 0) {
            parsedSets.push({ items: currentItems, price: '' });
          }

          // 6. 각 세트의 첫 번째 메뉴 아이템만 볼드 처리하고, 나머지는 텍스트만 그대로 받기 
          parsedSets.forEach(set => {
            if (set.items.length > 0) {
              let firstMenuFound = false;
              const formattedItems = set.items.map(item => {
                if (item === '[천원의아침밥]') return item; // 태그는 그대로 유지

                if (!firstMenuFound) {
                  firstMenuFound = true;
                  return `<b>${item}</b>`; // 첫 번째 메뉴만 볼드
                }
                return item;
              });

              menus.push({
                type: title,
                menu: formattedItems.join('\n'),
                price: set.price
              });
            }
          });
        }
      }
    });

    // 7. 운영시간 정규식 추출 
    const hours = {};
    const fullText = $('body').text().replace(/\s+/g, ' ');
    const hoursSection = fullText.match(/운영시간(.{0,300})/);
    if (hoursSection) {
      const pattern = /(조식|중식|석식)[\s:]*(\d{1,2}:\d{2}\s*~\s*\d{1,2}:\d{2})/g;
      let m;
      while ((m = pattern.exec(hoursSection[0])) !== null) {
        hours[m[1]] = m[2].replace(/\s+/g, ' ').replace(/\s*~\s*/g, '~').trim();
      }
    }

    return { id: cafeId, menus, hours };
  } catch (e) {
    return { id: cafeId, menus: [], hours: {}, error: true };
  }
}

// Vercel이 요청받을때 실행하는 진입점 함수 
export default async function handler(req, res) {
  // 1. 메서드 체크 + 캐시 헤더 설정 
  // 캐시 s-maxage=86400 (1일), stale-while-revalidate=3600 (1시간)
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  // 2. 날짜 파라미터 정규화 (학교 사이트 URL 파라미터에서 YYYY/MM/DD 슬래시를 요구해서 이로 변환함)
  const id = req.query.id || 'all';
  let dateStr = req.query.date;

  if (!dateStr) {
    const today = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    dateStr = today.toISOString().split('T')[0].replace(/-/g, '/');
  } else {
    dateStr = dateStr.replace(/-/g, '/');
  }

  // 3. id에 따라 분기 처리: all이면 모든 식당, 아니면 특정 식당만 스크래핑
  try {
    if (id === 'all') {
      const results = await Promise.all(CAFES.map(c => scrapeCafe(c.id, dateStr)));
      const data = CAFES.map((c, i) => ({
        ...c,
        menus: results[i].menus,
        hours: results[i].hours ?? {},
        hasJeyuk: results[i].menus.some(m => m.menu.includes('제육')),
        available: results[i].menus.length > 0
      }));
      return res.status(200).json({ success: true, date: dateStr, data });
    } else {
      const result = await scrapeCafe(id, dateStr);
      return res.status(200).json({
        success: true,
        date: dateStr,
        id: result.id,
        menus: result.menus,
        hasJeyuk: result.menus.some(m => m.menu.includes('제육'))
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
