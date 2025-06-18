/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary gradient colors (yellow to red)
        gold: "#FFD700",
        orange: "#FFA500",
        darkOrange: "#FF8C00",
        tomatoRed: "#FF6347",
        orangeRed: "#FF4500",
        crimsonRed: "#DC143C",
        
        // App theme colors
        darkPurple: "#2b2d5c",
        blue: "#211c84",
        darkBlue: "#1A1A1A",
        
        // UI colors
        white: "#FFFFFF",
        black: "#000000",
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
        grayLight: "#686a73",
        
        // Background colors
        tabBarBg: "#151623",
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
