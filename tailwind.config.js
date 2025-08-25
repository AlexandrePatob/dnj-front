/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-merriweather)', 'Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        christblue: {
          DEFAULT: 'var(--color-christblue)',
          dark: 'var(--color-christblue-dark)',
          light: 'var(--color-christblue-light)',
        },
        christgreen: {
          DEFAULT: 'var(--color-christgreen)',
          dark: 'var(--color-christgreen-dark)',
          light: 'var(--color-christgreen-light)',
        },
      },
    },
  },
  plugins: [],
}
