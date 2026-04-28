import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: [
          'Charter',
          'Iowan Old Style',
          'Source Serif Pro',
          'Georgia',
          'ui-serif',
          'serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Menlo',
          'Consolas',
          'ui-monospace',
          'monospace',
        ],
      },
      colors: {
        canvas: {
          DEFAULT: '#FAF9F6',
          dark: '#0E0E10',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          dark: '#E5E5E5',
        },
        muted: {
          DEFAULT: '#6B7280',
          dark: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#2563EB',
          dark: '#60A5FA',
        },
        sidebar: {
          DEFAULT: '#F3F2EE',
          dark: '#17171A',
        },
        line: {
          DEFAULT: '#E7E5E0',
          dark: '#27272A',
        },
      },
      transitionDuration: {
        DEFAULT: '120ms',
      },
    },
  },
  plugins: [],
};

export default config;
