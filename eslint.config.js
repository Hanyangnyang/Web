// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import babelParser from '@babel/eslint-parser'
import { defineConfig, globalIgnores } from 'eslint/config'

// js/jsx, ts/tsx 공통 규칙 — extends는 파일별로 따로 선언해야 해서 rules만 공유
// 대문자로 시작하는 이름은 컴포넌트/타입이라 JSX(<Story />)에서 쓰여도 no-unused-vars가
// 사용을 인지하지 못한다(그걸 알려주는 eslint-plugin-react를 쓰지 않음). 그래서 무시 패턴을 둔다.
// varsIgnorePattern은 '변수'에만 적용되므로, 매개변수용 argsIgnorePattern도 같이 있어야 한다.
const sharedRules = {
  'no-unused-vars': ['error', {
    varsIgnorePattern: '^[A-Z_]',
    argsIgnorePattern: '^[A-Z_]',
  }],
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: sharedRules,
  },
  // .ts/.tsx: typescript-eslint이 아직 TS 7(tsgo)을 지원하지 않아(typescript-eslint#10940),
  // 타입 인식 없이 Babel로 구문만 파싱 — react-hooks/unused-vars 등 AST 기반 규칙은 그대로 적용되고,
  // 타입 오류 검출은 어차피 `npm run typecheck`(tsc)가 담당
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'module',
        babelOptions: {
          presets: ['@babel/preset-react', '@babel/preset-typescript'],
        },
      },
    },
    rules: {
      ...sharedRules,
      'no-undef': 'off', // 타입/인터페이스 참조를 no-undef가 오탐하므로 끔 — tsc가 실제 미정의 참조를 잡아줌
    },
  },
  ...storybook.configs["flat/recommended"],
  // 스토리 이름을 한글로 짓고 있어서(예: 폭염맑음) PascalCase 규칙은 만족시킬 방법이 없다.
  // 한글에는 대소문자 개념이 없으므로 규칙 자체를 끈다.
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}'],
    rules: {
      'storybook/prefer-pascal-case': 'off',
    },
  },
])
