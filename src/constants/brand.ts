/**
 * PODDOCK ブランドカラー定義
 *
 * アプリ全体で使用するブランドカラーを一元管理
 * tailwind.config.mjs のdaisyUIテーマとも同期させること
 */

export const BRAND_COLORS = {
  /** メインカラー（黄色） */
  primary: '#fcd301',
  /** primary上のテキスト色（黒） */
  primaryContent: '#1a1a1a',
} as const;

/** デフォルトのポッドキャストテーマカラー */
export const DEFAULT_THEME_COLOR = BRAND_COLORS.primary;
