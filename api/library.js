// Vercel Serverless Function: Library API Proxy
export default async function handler(req, res) {
  // Edge Caching: 30 minutes
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
  // CORS 헤더 설정 (필요한 경우)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Pyxis-Auth-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://lib.hanyang.ac.kr/pyxis-api/2/seat-rooms?smufMethodCode=PC&roomTypeId=7&branchGroupId=2', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'Referer': 'https://information.hanyang.ac.kr/',
        'Origin': 'https://information.hanyang.ac.kr'
      }
    });

    if (!response.ok) {
      throw new Error(`Library API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '도서관 데이터를 가져오는 데 실패했습니다.',
      error: error.message 
    });
  }
}
