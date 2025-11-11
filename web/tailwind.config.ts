import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      boxShadow: {
        card: '0 15px 35px -15px rgba(15, 23, 42, 0.6)',
      },
    },
  },
  plugins: [],
} satisfies Config
