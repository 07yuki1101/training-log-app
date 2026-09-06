function ReviewPrompt({ onReview, onClose }) {
  return (
    <div className="review-prompt">
      <div className="review-prompt-card">
        <button className="review-prompt-close" onClick={onClose} aria-label="閉じる">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="review-prompt-icon">
          <span className="material-symbols-outlined">star</span>
        </div>
        <div className="review-prompt-body">
          <p className="review-prompt-title">記録、続いていますね！</p>
          <p className="review-prompt-desc">よろしければアプリのレビューで応援していただけると嬉しいです。</p>
        </div>
        <div className="review-prompt-actions">
          <button className="review-prompt-later-btn" onClick={onClose}>後で</button>
          <button className="review-prompt-review-btn" onClick={onReview}>レビューを書く</button>
        </div>
      </div>
    </div>
  );
}

export default ReviewPrompt;
