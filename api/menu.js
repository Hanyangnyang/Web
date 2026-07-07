import * as cheerio from 'cheerio';

const CAFES = [
  { id: 're12', name: '학생식당' },
  { id: 're15', name: '창업보육센터' },
  { id: 're11', name: '교직원식당' },
  { id: 're13', name: '기숙사식당' }
];

async function scrapeCafe(cafeId, dateStr) {
  const encodedDate = encodeURIComponent(dateStr);
  const url = `https://www.hanyang.ac.kr/web/www/${cafeId}?p_p_id=kr_ac_hanyang_cafe_web_portlet_CafePortlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_kr_ac_hanyang_cafe_web_portlet_CafePortlet_sMenuDate=${encodedDate}&_kr_ac_hanyang_cafe_web_portlet_CafePortlet_action=view`;

  try {
    const fetchRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!fetchRes.ok) return { id: cafeId, menus: [], error: true };

    const html = await fetchRes.text();
    const $ = cheerio.load(html);
    const menus = [];

    $('h3').each((i, el) => {
      const title = $(el).text().trim();
      const ignoreList = ['검색', '댓글', '창업보육', '학생식당', '교직원', '창의인재', '푸드코트', '위치', '조회'];

      if (title && !title.includes('원') && !ignoreList.some(ig => title.includes(ig))) {
        let menuText = $(el).next().text().replace(/\s+/g, ' ').trim();
        if (menuText && menuText.length > 5 && !menuText.includes('확인 가능합니다')) {
          // 1. [천원의아침밥] 뒤에 띄어쓰기 없으면 강제로 공백 추가 (파싱용)
          menuText = menuText.replace(/(\[천원의아침밥\])([^\s])/g, '$1 $2');

          const rawItems = menuText
            .replace(/"/g, '')
            .split(/\s+/)
            .filter(item => !/[a-zA-Z]/.test(item))
            .filter(item => item !== '&') // 단독으로 남은 & 제거
            .filter(item => item.trim().length > 0);

          const parsedSets = [];
          let currentItems = [];

          rawItems.forEach(item => {
            if (/\d+.*원/.test(item)) {
              // It's a price.
              parsedSets.push({ items: [...currentItems], price: item });
              currentItems = [];
            } else {
              currentItems.push(item);
            }
          });
          if (currentItems.length > 0) {
            parsedSets.push({ items: currentItems, price: '' });
          }

          parsedSets.forEach(set => {
            if (set.items.length > 0) {
              let firstMenuFound = false;
              const formattedItems = set.items.map(item => {
                if (item === '[천원의아침밥]') return item; // 태그는 그대로 유지

                if (!firstMenuFound) {
                  firstMenuFound = true;
                  return `• <b>${item}</b>`; // 첫 번째 메뉴는 볼드 + 불렛
                }
                return `• ${item}`; // 나머지는 불렛만
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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  // Add Edge Caching: Cache for 1 day, revalidate in background
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  const id = req.query.id || 'all';
  let dateStr = req.query.date;

  if (!dateStr) {
    const today = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    dateStr = today.toISOString().split('T')[0].replace(/-/g, '/');
  } else {
    dateStr = dateStr.replace(/-/g, '/');
  }

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
