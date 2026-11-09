/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        surface: '#FFFFFF',
        ink: '#20211F',
        mute: '#777871',
        accent: '#C5553D',
        line: '#E5E2DA',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'Noto Sans KR',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        num: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(32, 33, 31, 0.08)',
      },
    },
  },
  plugins: [],
}
