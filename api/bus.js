// Vercel Serverless Function: Bus Arrival Data Proxy
// Integrates Gyeonggi-do Bus Arrival Service (v2) with Cache-Aside + Single-Flight (Request Coalescing)

const cache = {};
const activeFetches = {};
const CACHE_TTL = 40 * 1000; // 40 seconds

async function getBusArrivals(stationId) {
  const now = Date.now();
  const cached = cache[stationId];

  // 1. Check if valid cache exists and is fresh (within 40 seconds)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // 2. Check if a fetch request is already in progress for this stationId
  if (activeFetches[stationId]) {
    // Wait for the in-progress promise to resolve
    return activeFetches[stationId];
  }

  // 3. Kick off a single-flight request
  const fetchPromise = (async () => {
    try {
      const busKey = process.env.BUS_KEY;
      if (!busKey) {
        throw new Error('BUS_KEY is not configured in environment variables');
      }

      // Public Data Portal keys are often already URL-encoded.
      // If it contains '%' characters, it's already encoded; otherwise, encode it.
      const encodedKey = busKey.includes('%') ? busKey : encodeURIComponent(busKey);

      // Base URL for Gyeonggi Bus Arrival Service v2
      const url = `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListv2?serviceKey=${encodedKey}&stationId=${stationId}&format=json`;

      // Timeout after 6 seconds to prevent serverless function timeout hangs
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) {
        throw new Error(`Public Bus API returned HTTP ${response.status}`);
      }

      const data = await response.json();

      // If the API returned a structured response, cache it (including empty arrivals or errors to prevent hammering)
      const resultCode = data.response?.msgHeader?.resultCode;
      if (resultCode !== undefined) {
        cache[stationId] = {
          data,
          timestamp: Date.now()
        };
      }

      return data;
    } catch (error) {
      console.error(`[Bus API Error] Failed to fetch station ${stationId}:`, error.message);

      // Fallback to stale cache if it exists to maintain high availability
      if (cached) {
        console.warn(`[Bus API Warning] Serving stale cached data for station ${stationId}`);
        return cached.data;
      }
      throw error;
    } finally {
      // Clean up the active fetch promise once complete
      delete activeFetches[stationId];
    }
  })();

  activeFetches[stationId] = fetchPromise;
  return fetchPromise;
}

export default async function handler(req, res) {
  const { stationId } = req.query;

  if (!stationId) {
    return res.status(400).json({ error: 'stationId is required' });
  }

  // 새벽 비운행 시간대 차단 (01:30 ~ 05:00 KST)
  const now = new Date();
  const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const hours = kstDate.getUTCHours();
  const minutes = kstDate.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes >= 90 && totalMinutes < 300) { // 1:30 = 90 mins, 5:00 = 300 mins
    return res.status(200).json({
      response: {
        msgHeader: { resultCode: "0", resultMessage: "정상" },
        msgBody: { busArrivalList: [] }
      }
    });
  }

  try {
    const data = await getBusArrivals(stationId.trim());
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
