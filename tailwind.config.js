/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        od: {
          purple:       '#714B67',
          'purple-d':   '#5E3D56',
          'purple-l':   '#9B7695',
          'purple-bg':  '#F3EFF2',
          'purple-border':'#D4C3D0',
          bg:           '#F1F1F1',
          white:        '#FFFFFF',
          border:       '#D9D9D9',
          text:         '#212529',
          muted:        '#888888',
          link:         '#017E84',
          success:      '#28A745',
          'success-bg': '#EBF6EC',
          warning:      '#E9A800',
          'warning-bg': '#FFF9E6',
          danger:       '#DC3545',
          'danger-bg':  '#FDECEA',
          info:         '#0078BF',
          'info-bg':    '#E3F2FD',
          topbar:       '#1B1B1B',
        },
      },
      fontSize: {
        '10': ['10px', '14px'],
        '11': ['11px', '15px'],
        '12': ['12px', '16px'],
        '13': ['13px', '18px'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.08)',
        'card-md': '0 2px 8px rgba(0,0,0,.10)',
        'card-hover': '0 4px 12px rgba(0,0,0,.12)',
        dropdown: '0 6px 20px rgba(0,0,0,.15)',
      },
    },
  },
  plugins: [],
};
