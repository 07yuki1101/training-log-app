import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function SetupName({ user, onComplete }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await setDoc(doc(db, 'userProfiles', user.uid), {
        displayName: trimmed,
        email: user.email,
        photoUrl: user.photoURL || ''
      }, { merge: true });
      onComplete();
    } catch (e) {
      console.error('名前の保存に失敗:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '0 24px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--friends)', marginBottom: 16 }}>badge</span>
      <h2 style={{ marginBottom: 8, textAlign: 'center' }}>ニックネームを設定</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
        友達にトレーニングを共有するときに表示される名前です
      </p>
      <div className="form" style={{ width: '100%', maxWidth: 400 }}>
        <input
          type="text"
          placeholder="ニックネーム"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
          maxLength={20}
        />
        <button
          className="add-btn"
          onClick={handleSave}
          disabled={!name.trim() || loading}
        >
          {loading ? '保存中...' : '決定'}
        </button>
      </div>
    </div>
  );
}

export default SetupName;
