import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: { relative: true, files: ['./index.html', './src/**/*.{ts,tsx}'] },
  theme: {
    container: { center: true, padding: '1.25rem', screens: { '2xl': '1280px' } },
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: { bg: c('bg'), surface: c('surface'), surface2: c('surface-2'), fg: c('fg'), muted: c('muted'), primary: c('primary'), secondary: c('secondary'), accent: c('accent'), line: 'rgb(var(--line) / var(--line-a))' },
      fontFamily: { display: ['"Space Grotesk"', 'sans-serif'], sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'monospace'] },
      borderRadius: { card: 'var(--radius)' },
      boxShadow: { glowP: 'var(--glow-p)', glowA: 'var(--glow-a)', glowS: 'var(--glow-s)' },
    },
  },
  plugins: [animate],
} satisfies Config;
