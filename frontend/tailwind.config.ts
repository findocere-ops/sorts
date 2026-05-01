import type { Config } from 'tailwindcss';

/**
 * Tailwind tokens mirror the CSS variables in src/styles/globals.css so that
 * any utility classes we keep (`bg-bg-card`, `text-cyan`, etc.) point at the
 * same brand palette as the inline-styled components ported from the design
 * handoff. Brand source: handoff/sorts/project/SORTS-standalone.html.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base':       '#05070A',
        'bg-panel':      '#080D12',
        'bg-card':       '#0C131A',
        'bg-elevated':   '#101923',
        'bg-hover':      '#14202D',

        'border-subtle': 'rgba(255,255,255,0.08)',
        'border-mid':    'rgba(255,255,255,0.16)',
        'border-cyan':   'rgba(45,232,224,0.35)',
        'border-orange': 'rgba(255,138,0,0.35)',

        'text-1': '#F7FAFC',
        'text-2': '#A8B3C2',
        'text-3': '#6F7A89',

        cyan:    { DEFAULT: '#2DE8E0', soft: '#00B8C7' },
        orange:  { DEFAULT: '#FF8A00' },
        gold:    { DEFAULT: '#FFC629' },
        success: { DEFAULT: '#22C55E' },
        warning: { DEFAULT: '#F59E0B' },
        danger:  { DEFAULT: '#EF4444' },

        // Legacy aliases — kept so unmigrated pages don't break during cutover.
        accent:  '#2DE8E0',
        teal:    '#2DE8E0',
        emerald: '#22C55E',
        amber:   '#FFC629',
        rose:    '#EF4444',
        purple:  '#A78BFA',
      },
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs:  '4px',
        sm:  '6px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        soft:          '0 2px 12px rgba(0,0,0,0.4)',
        card:          '0 4px 24px rgba(0,0,0,0.5)',
        'glow-cyan':   '0 0 60px rgba(45,232,224,0.10)',
        'glow-orange': '0 0 60px rgba(255,138,0,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
