import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(220 13% 91%)',
        muted: 'hsl(220 14% 96%)',
        foreground: 'hsl(222 47% 11%)',
      },
    },
  },
  plugins: [],
} satisfies Config
