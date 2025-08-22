import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        voice: {
          active: '#10b981',
          inactive: '#6b7280',
          listening: '#f59e0b',
        }
      },
      animation: {
        'pulse-voice': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-voice': 'bounce 1s infinite',
      }
    },
  },
  plugins: [],
}
export default config