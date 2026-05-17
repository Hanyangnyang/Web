const CAFES = {
  're12': '학생식당',
  're15': '창업보육센터',
  're11': '교직원식당',
  're13': '기숙사식당',
};

function getDateLabel(dateStr) {
  const nowKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  const today = nowKst.toISOString().split('T')[0];
  const tomorrow = new Date(nowKst.getTime() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(nowKst.getTime() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return '오늘';
  if (dateStr === tomorrow) return '내일';
  if (dateStr === yesterday) return '어제';
  const d = new Date(dateStr);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

function getMealLabel(type) {
  if (type.includes('조식') || type.includes('천원')) return '아침';
  if (type.includes('석식')) return '저녁';
  return '점심';
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  const { date, cafe, type } = req.query;
  const decodedType = decodeURIComponent(type || '');
  const effectiveDate = date || new Date(new Date().getTime() + 9 * 3600000).toISOString().split('T')[0];

  const appUrl = `https://www.hanyang.life/?date=${effectiveDate}&cafe=${cafe || ''}&type=${encodeURIComponent(decodedType)}`;
  const cafeName = CAFES[cafe] || '식당';
  const dateLabel = getDateLabel(effectiveDate);
  const mealLabel = getMealLabel(decodedType);
  const ogTitle = `하냥냥 - ${dateLabel} ${cafeName} ${mealLabel}`;

  let description = '더 많은 학식 메뉴를 확인해보세요!';
  try {
    const menuRes = await fetch(`https://www.hanyang.life/api/menu?id=${cafe}&date=${effectiveDate}`);
    if (menuRes.ok) {
      const { menus = [] } = await menuRes.json();
      const matched = menus.filter(m =>
        m.type === decodedType || m.type.includes(decodedType) || decodedType.includes(m.type)
      );
      if (matched.length > 0) {
        const lines = matched.flatMap(m =>
          m.menu.split('\n')
            .map(line => line.replace(/<[^>]+>/g, '').replace(/^•\s*/, '').trim())
            .filter(Boolean)
            .map(line => `  • ${line}`)
        );
        description = lines.join('\n');
      }
    }
  } catch {}

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(ogTitle)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escHtml(appUrl)}" />
  <meta property="og:title" content="${escHtml(ogTitle)}" />
  <meta property="og:description" content="${escHtml(description)}" />
  <meta name="description" content="${escHtml(description)}" />
  <meta http-equiv="refresh" content="0; url=${escHtml(appUrl)}" />
</head>
<body>
  <script>window.location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
  return res.status(200).send(html);
}
