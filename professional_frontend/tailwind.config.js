/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        'deep-teal': '#013145',
        'emerald': '#10B981',
        'emerald-600': '#059669',

        // Extended Color Palette
        'emerald-400': '#34D399',
        'cyan-400': '#22D3EE',
        
        // Text Colors
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        
        // Category Colors
        'financial': '#3B82F6',
        'manufacturing': '#8B5CF6',
        'healthcare': '#10B981',
        'sales': '#F59E0B',
        'developer': '#6B7280',
        'miscellaneous': '#EC4899',
        
        // Background Colors
        'bg-light': '#F9FAFB',
        'bg-card': '#FFFFFF',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
