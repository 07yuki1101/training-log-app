// App Storeレビュー依頼バナーの表示可否をlocalStorageで管理する。
// 暫定策（低コスト版）: SKStoreReviewControllerは使わず、
// itms-apps://.../write-review へのリンクを案内するだけ。
const STORAGE_KEY = 'reviewPrompt';

// 累計トレーニング記録がこの件数に達したら候補にする
export const REVIEW_PROMPT_THRESHOLD = 5;

// 「後で」で閉じた後、再表示までの最短間隔（日）
const COOLDOWN_DAYS = 14;

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorageが使えない環境（プライベートモード等）では何もしない
  }
}

// recordCount: 現時点の累計トレーニング記録件数
export function shouldShowReviewPrompt(recordCount) {
  if (recordCount < REVIEW_PROMPT_THRESHOLD) return false;

  const state = readState();
  if (state.completed) return false;

  if (state.lastShownAt) {
    const elapsedDays = (Date.now() - state.lastShownAt) / (1000 * 60 * 60 * 24);
    if (elapsedDays < COOLDOWN_DAYS) return false;
  }

  return true;
}

// バナーを表示した時点で呼ぶ（同じ期間内の再表示を防ぐ）
export function markReviewPromptShown() {
  writeState({ ...readState(), lastShownAt: Date.now() });
}

// 「レビューを書く」を押した時点で呼ぶ（以後は表示しない）
export function markReviewPromptCompleted() {
  writeState({ ...readState(), completed: true, lastShownAt: Date.now() });
}
