/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // 🎨 Primary Brand Colors
        primary: {
          lime: '#B6F500',      // Primary accent (tab icons, focused states)
          orange: '#FF8C00',    // Primary orange (sliders, accents)
        },

        // 🌈 Gradient Colors
        gradient: {
          wave: {
            1: '#FFAF00',
            2: '#FF8C00', 
            3: '#FF4E00',
            4: '#FF2C00',
            5: '#FF1E00',
          },
          background: {
            1: '#1e0e2f',
            2: '#2c1348', 
            3: '#3a1a5d',
          },
        },

        // 🎯 UI Colors
        ui: {
          white: '#FFFFFF',
          black: '#000000',
          gray: {
            light: '#E0E0E0',   // Inactive text/icons
            medium: '#686a73',  // Slider track
            dark: '#666666',    // Profile icon
          },
        },

        // 🎭 Background Colors
        background: {
          dark: '#151623',      // Card backgrounds
          darker: '#1a1a1a',    // Profile avatar
        },

        // 🎪 Interactive States
        states: {
          focused: '#B6F500',   // Active/focused state
          inactive: '#E0E0E0',  // Inactive state
        },

        // 🎨 Transparent Colors
        transparent: {
          white: {
            5: 'rgba(255, 255, 255, 0.05)',
            10: 'rgba(255, 255, 255, 0.1)',
          },
        },

        // Legacy color support (keeping for backward compatibility)
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        'space-mono': ['SpaceMono', 'monospace'],
        'poppins': ['Poppins', 'sans-serif'],
        'poppins-bold': ['Poppins-Bold', 'sans-serif'],
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
