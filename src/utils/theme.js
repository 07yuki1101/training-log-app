// ライト/ダークテーマの切り替えをlocalStorageで管理する。
// テーマの見た目自体はsrc/index.cssのCSS変数（:root / [data-theme="light"]）側で定義し、
// ここでは <html data-theme="..."> 属性の付け替えと保存だけを担当する。
const STORAGE_KEY = 'themePreference';

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
};

// 保存済みのテーマ設定を読む（未設定・読み取り不可なら常にダークをデフォルトにする）
export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
  } catch {
    return THEMES.DARK;
  }
}

// DOMにテーマを反映するだけ（保存はしない）
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === THEMES.LIGHT) {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
}

// テーマを保存し、即座にDOMへ反映する
export function setTheme(theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorageが使えない環境（プライベートモード等）では反映のみ行う
  }
}

// 起動時に一度だけ呼ぶ。保存済みのテーマ（未設定ならダーク）をDOMに適用する
export function initTheme() {
  applyTheme(getStoredTheme());
}
