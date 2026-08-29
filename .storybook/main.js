/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",

  // Storybook은 vite.config.js를 그대로 물려받는데, 거기 있는 PWA 플러그인이 빌드를 깨뜨린다.
  // Storybook 자체 번들(sb-manager/globals-runtime.js, 3.29MB)이 vite.config에 정해둔 workbox
  // 캐시 상한(3MB)을 넘겨서 에러가 나는 것. 스토리북에는 서비스워커가 필요 없으므로 제외한다.
  //
  // flat()이 필요한 이유: VitePWA()는 플러그인 하나가 아니라 여러 개(pwa/info/build/dev-sw/
  // pwa-assets)를 배열로 반환해서, 중첩된 채로 들어온다. 평탄화하지 않으면 filter가 못 본다.
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    plugins: (viteConfig.plugins ?? [])
      .flat(Infinity)
      .filter((plugin) => !String(plugin?.name ?? '').startsWith('vite-plugin-pwa')),
  }),
};
export default config;
