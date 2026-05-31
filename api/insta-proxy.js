import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const S_MAXAGE = 2592000; // 30 days in seconds
const CACHE_DIR = path.join('/tmp', 'insta-cache');

try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {}

const fetchWithRetry = (username, retries = 3) => {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'x-ig-app-id': '936619743392459',
        'Accept': '*/*',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Referer': `https://www.instagram.com/${username}/`,
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    const performFetch = (attempt) => {
      https.get(apiUrl, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const user = json.data?.user;
              if (user) {
                return resolve({
                  username,
                  fullName: user.full_name || username,
                  profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url,
                  success: true,
                  fetchedAt: new Date().getTime()
                });
              }
            } catch (e) {}
          }
          
          if (attempt < retries) {
            const delay = 1000 * (attempt + 1);
            console.log(`Retrying ${username} (Attempt ${attempt + 1}) after ${delay}ms... (Status ${res.statusCode})`);
            setTimeout(() => performFetch(attempt + 1), delay);
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        if (attempt < retries) {
          setTimeout(() => performFetch(attempt + 1), 1000 * (attempt + 1));
        } else {
          reject(err);
        }
      });
    };

    performFetch(0);
  });
};

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) return res.status(400).send('Username required');

  // Prevent path traversal: only allow alphanumeric, underscores, hyphens, and dots
  const safeUsername = String(username).replace(/[^a-zA-Z0-9_.\-]/g, '');
  if (!safeUsername || safeUsername !== username) return res.status(400).send('Invalid username');

  const cachePath = path.join(CACHE_DIR, `${safeUsername}.json`);

  // 1. Try local cache
  try {
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      if (new Date().getTime() - new Date(stats.mtime).getTime() < CACHE_TTL) {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        res.setHeader('Cache-Control', `s-maxage=${S_MAXAGE}, stale-while-revalidate=86400`);
        return res.status(200).json({ ...cachedData, fromCache: true });
      }
    }
  } catch (e) {}

  try {
    // 2. Fetch with retry
    const result = await fetchWithRetry(safeUsername);

    // 3. If successful, set long cache and save
    res.setHeader('Cache-Control', `s-maxage=${S_MAXAGE}, stale-while-revalidate=86400`);
    try {
      fs.writeFileSync(cachePath, JSON.stringify(result));
    } catch (e) {}

    res.status(200).json(result);
  } catch (error) {
    console.error(`Insta Proxy Final Error for ${safeUsername}:`, error.message);

    // 4. IMPORTANT: On failure, return the local fallback image info
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({
      username: safeUsername,
      fullName: safeUsername,
      profilePicUrl: '/hanyang_insta_fallback.png',
      error: true,
      success: false
    });
  }
}
