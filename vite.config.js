import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { visualizer } from 'rollup-plugin-visualizer';
import { generateFirebaseMessagingSw } from './scripts/generateFirebaseMessagingSw.js'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  // public/firebase-messaging-sw.js는 Service Worker라 별도 빌드 처리가 없으면
  // .env 값을 못 읽으므로, 같은 env로 매 dev/build 시작 시 다시 생성해 소스를 하나로 유지
  generateFirebaseMessagingSw(env);

  return {
    build: {
      sourcemap: true, // Source map generation must be turned on
    },
    server: {
      // 로컬 개발 전용 프록시. 브라우저는 same-origin(/backend)으로만 요청하니 CORS 검사를 타지 않고,
      // 실제 백엔드 호출은 Vite(Node)가 대신한다 — curl이 통과하는 것과 같은 서버 간 요청이 된다.
      //
      // ⚠️ 프로덕션 빌드에는 이 서버가 없다. 앱은 www.hanyang.life에서 api.hanyang.life를 직접 부르므로
      //    배포 전에는 백엔드 CORS 허용이 반드시 필요하다. 이건 로컬 개발을 막지 않으려는 우회일 뿐이다.
      //
      // 접두사가 '/api'가 아닌 이유: 아래 api-emulator 미들웨어가 '/api/'를 먼저 가로채서
      // ./api/v1/banners.js를 찾다가 매 요청마다 에러 로그를 남긴다.
      proxy: env.VITE_API_BASE_URL ? {
        '/backend': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend/, ''),
          configure: (proxy) => {
            // 핵심: Origin을 그대로 넘기면 백엔드 CORS 필터가 프록시 요청도 똑같이 403으로 막는다.
            // (Spring의 CORS 검사는 브라우저 여부가 아니라 Origin 헤더 유무로 동작한다)
            // 헤더를 떼어내 curl과 동일한 조건으로 보낸다.
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
          },
        },
      } : undefined,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons.svg'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 3000000,
          clientsClaim: true,
          skipWaiting: true,
        },
        manifest: {
          name: '하냥냥',
          short_name: '하냥냥',
          description: '한양대학교 에리카 학생을 위한 서비스',
          theme_color: '#0e4a84',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      }),
      {
        name: 'api-emulator',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url.startsWith('/api/')) {
              const [urlPath, queryStr] = req.url.split('?');
              const apiFilePath = `./api${urlPath.substring(4)}.js`;
              
              try {
                // Dynamically import the API handler
                const module = await server.ssrLoadModule(apiFilePath);
                const handler = module.default;

                // Minimal request/response mocking
                req.query = Object.fromEntries(new URLSearchParams(queryStr));
                
                res.status = (code) => {
                  res.statusCode = code;
                  return res;
                };
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                };
                res.send = (data) => res.end(data);

                await handler(req, res);
                return;
              } catch (err) {
                console.error(`API Emulator Error (${req.url}):`, err);
              }
            }
            next();
          });
        }
      },
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "hanyangnyang",
        project: "capacitor",
      }),
      // ANALYZE=true npm run build 로만 실행 — 매 빌드마다 분석 리포트를 만들 필요는 없음
      process.env.ANALYZE && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean)
  }
})
