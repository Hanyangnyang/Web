import https from 'https';

const username = 'hanyang_erica_official';
const url = `https://www.instagram.com/${username}/embed/`;

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  }
};

console.log(`Testing Instagram __a=1 Scraping for ${username}...`);

https.get(url, options, (res) => {
  let data = '';
  console.log(`Status Code: ${res.statusCode}`);

  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Body Length:', data.length);
    if (res.statusCode === 200) {
      const ogIdx = data.indexOf('og:image');
      const picIdx = data.indexOf('profile_pic_url');
      console.log('og:image index:', ogIdx);
      console.log('profile_pic_url index:', picIdx);

      if (ogIdx !== -1) {
          console.log('og:image snippet:', data.substring(ogIdx - 50, ogIdx + 200));
      }
      if (picIdx !== -1) {
          console.log('profile_pic_url snippet:', data.substring(picIdx - 50, picIdx + 200));
      }

      // 1. Try og:image
      const ogMatch = data.match(/property="og:image"\s+content="([^"]+)"/) || data.match(/content="([^"]+)"\s+property="og:image"/);
      if (ogMatch) {
          console.log('Success! Found og:image:', ogMatch[1]);
          return;
      }
      
      // 2. Try profile_pic_url
      const picMatch = data.match(/"profile_pic_url":"([^"]+)"/);
      if (picMatch) {
          console.log('Success! Found profile_pic_url:', picMatch[1].replace(/\\u0026/g, '&'));
          return;
      }

      console.log('Failed to find image in HTML.');
    } else {
      console.error(`Error: Received Status ${res.statusCode}`);
    }
  });
}).on('error', (err) => {
  console.error('Request Error:', err.message);
});
