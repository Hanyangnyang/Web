import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
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
          description: '빠른 한양대 도서관 입장을 위한 QR 패스',
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
      }
    ]
  }
})
