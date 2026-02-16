/** @type {import('tailwindcss').Config} */

// PODDOCK ブランドカラー
const brandColors = {
  primary: '#fcd301', // メインカラー（黄色）
  primaryContent: '#1a1a1a', // primary上のテキスト色（黒）
};

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', '"Zen Kaku Gothic New"', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          'color-scheme': 'light',
          primary: brandColors.primary,
          'primary-content': brandColors.primaryContent,
          secondary: '#f5f5f5',
          'secondary-content': '#1a1a1a',
          accent: '#fcd301',
          'accent-content': '#1a1a1a',
          neutral: '#2a2a2a',
          'neutral-content': '#fafafa',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#e5e7eb',
          'base-content': '#1f2937',
          info: '#3b82f6',
          'info-content': '#ffffff',
          success: '#22c55e',
          'success-content': '#ffffff',
          warning: '#f59e0b',
          'warning-content': '#ffffff',
          error: '#ef4444',
          'error-content': '#ffffff',
        },
      },
      {
        dark: {
          'color-scheme': 'dark',
          primary: brandColors.primary,
          'primary-content': brandColors.primaryContent,
          secondary: '#374151',
          'secondary-content': '#f9fafb',
          accent: '#fcd301',
          'accent-content': '#1a1a1a',
          neutral: '#1f2937',
          'neutral-content': '#f9fafb',
          'base-100': '#1f2937',
          'base-200': '#111827',
          'base-300': '#0f172a',
          'base-content': '#f9fafb',
          info: '#3b82f6',
          'info-content': '#ffffff',
          success: '#22c55e',
          'success-content': '#ffffff',
          warning: '#f59e0b',
          'warning-content': '#ffffff',
          error: '#ef4444',
          'error-content': '#ffffff',
        },
      },
    ],
  },
};
