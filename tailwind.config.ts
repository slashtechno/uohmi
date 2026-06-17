import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        border: 'var(--border)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        accent: 'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        'accent-bg': 'var(--accent-bg)',
        's-draft-bg': 'var(--s-draft-bg)',
        's-draft-text': 'var(--s-draft-text)',
        's-open-bg': 'var(--s-open-bg)',
        's-open-text': 'var(--s-open-text)',
        's-closed-bg': 'var(--s-closed-bg)',
        's-closed-text': 'var(--s-closed-text)',
        's-paid-bg': 'var(--s-paid-bg)',
        's-paid-text': 'var(--s-paid-text)',
        's-forgiven-bg': 'var(--s-forgiven-bg)',
        's-forgiven-text': 'var(--s-forgiven-text)',
        's-confirm-bg': 'var(--s-confirm-bg)',
        's-confirm-text': 'var(--s-confirm-text)',
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
      },
    },
  },
  plugins: [],
} satisfies Config