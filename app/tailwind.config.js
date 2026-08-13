/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: { DEFAULT: 'var(--bg)', card: 'var(--card)', line: 'var(--line)' },
        ink: { DEFAULT: 'var(--ink)', muted: 'var(--ink-muted)', faint: 'var(--ink-faint)' },
        accent: { DEFAULT: 'var(--accent)', bright: 'var(--accent-bright)', dim: 'var(--accent-dim)', ink: 'var(--accent-ink)' },
        calm: 'var(--calm)',
        alert: { DEFAULT: 'var(--alert)', bg: 'var(--alert-bg)', line: 'var(--alert-line)' },
        /* aliases do tema antigo, para não quebrar telas já escritas */
        gold: { DEFAULT: 'var(--accent)', bright: 'var(--accent-bright)', dim: 'var(--accent-dim)' },
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: { xl: '16px', '2xl': '20px', '3xl': '26px' },
      spacing: { safeb: 'env(safe-area-inset-bottom)' },
    },
  },
  plugins: [],
};
