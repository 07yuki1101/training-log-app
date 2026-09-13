import { useRef, useState } from "react";
import ShareCard from "./ShareCard";
import { shareCardAsImage } from "../utils/shareImage";

function ShareModal({ variant, date, items, points, latest, onClose }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async () => {
    setSharing(true);
    setError('');
    try {
      const fileName = `training-log_${variant}_${(date || latest?.date || 'share').replaceAll('-', '')}.png`;
      const text = variant === 'weight'
        ? '体重の記録 #TrainingLog'
        : `${date}のトレーニング記録 #TrainingLog`;
      await shareCardAsImage(cardRef.current, { fileName, title: 'Training Log', text });
    } catch (err) {
      console.error('シェアに失敗:', err);
      setError('シェアに失敗しました。もう一度お試しください。');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="share-modal-title">記録をシェア</h3>

        <div className="share-preview">
          <ShareCard
            ref={cardRef}
            variant={variant}
            date={date}
            items={items}
            points={points}
            latest={latest}
          />
        </div>

        {error && <p className="share-error">{error}</p>}

        <button className="share-confirm-btn" onClick={handleShare} disabled={sharing}>
          <span className="material-symbols-outlined">ios_share</span>
          {sharing ? '画像を作成中…' : '画像をシェア'}
        </button>
        <button onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}

export default ShareModal;
