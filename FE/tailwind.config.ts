import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ReadB 색 체계. 값은 styles/globals.css의 --rb-* 와 동일하게 유지.
        brand: {
          DEFAULT: '#7185F2',
          hover: '#5A6FE0',
          soft: '#EEF0FD',
        },
        ink: {
          DEFAULT: '#1A1D29',
          secondary: '#6B7080',
          muted: '#9A9EAB',
        },
        line: '#E6E8EE',
        canvas: '#F7F8FA',
        risk: {
          DEFAULT: '#D64545',
          soft: '#FBECEC',
        },
        caution: {
          DEFAULT: '#C98A1B',
          soft: '#FBF3E4',
          strong: '#8A5D0F',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
