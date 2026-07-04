import { useState } from "react";
import { collection, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const toTotalSeconds = (h, m, s) =>
  (Number(h || 0) * 3600) + (Number(m || 0) * 60) + Number(s || 0);

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}時間${m}分${s}秒`;
  return `${m}分${s}秒`;
};

const formatPace = (timeSeconds, distance) => {
  if (!distance || distance === 0) return '-';
  const totalMinutes = timeSeconds / 60;
  const pace = totalMinutes / distance;
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}'${String(sec).padStart(2, '0')}"/km`;
};

const splitSeconds = (totalSeconds) => ({
  hours: Math.floor(totalSeconds / 3600),
  minutes: Math.floor((totalSeconds % 3600) / 60),
  seconds: totalSeconds % 60,
});

const getToday = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = { date: '', distance: '', hours: '', minutes: '', seconds: '', comment: '' };

function RunPage({ user, runRecords, fetchRunRecords }) {
  const [showForm, setShowForm] = useState(false);
  const [newRun, setNewRun] = useState(EMPTY_FORM);
  const [editRun, setEditRun] = useState(null);
  const [showAllLog, setShowAllLog] = useState(false);

  const totalSeconds = toTotalSeconds(newRun.hours, newRun.minutes, newRun.seconds);

  const handleSave = async () => {
    if (!newRun.date) { alert('日付を入れてください'); return; }
    if (!newRun.distance) { alert('距離を入れてください'); return; }
    if (totalSeconds === 0) { alert('時間を入れてください'); return; }

    const data = {
      date: newRun.date,
      distance: Number(newRun.distance),
      timeSeconds: totalSeconds,
      comment: newRun.comment || '',
      updatedAt: serverTimestamp()
    };

    try {
      if (editRun) {
        await updateDoc(doc(db, 'users', user.uid, 'runs', editRun.id), data);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'runs'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      await fetchRunRecords(user.uid);
      setNewRun(EMPTY_FORM);
      setEditRun(null);
      setShowForm(false);
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'users', user.uid, 'runs', id));
    await fetchRunRecords(user.uid);
  };

  const handleEdit = (run) => {
    const { hours, minutes, seconds } = splitSeconds(run.timeSeconds ?? (run.time ?? 0) * 60);
    setEditRun(run);
    setNewRun({ date: run.date, distance: run.distance, hours, minutes, seconds, comment: run.comment || '' });
    setShowForm(true);
  };

  const sorted = [...runRecords].sort((a, b) => b.date.localeCompare(a.date));
  const LIMIT = 10;
  const displayed = showAllLog ? sorted : sorted.slice(0, LIMIT);

  return (
    <div>
      {!showForm && (
        <div className="form-switch">
          <button className="add-btn" onClick={() => {
            setShowForm(true);
            setNewRun(prev => ({ ...prev, date: getToday() }));
          }}>ランを追加</button>
        </div>
      )}

      {showForm && (
        <div className="form">
          <input
            type="date"
            value={newRun.date}
            onChange={(e) => setNewRun({ ...newRun, date: e.target.value })}
          />

          <input
            type="number"
            placeholder="距離（km）"
            step="0.01"
            min="0"
            value={newRun.distance}
            onChange={(e) => setNewRun({ ...newRun, distance: e.target.value })}
          />

          <div className="set-row">
            <input
              type="number"
              placeholder="時間"
              min="0"
              value={newRun.hours}
              onChange={(e) => setNewRun({ ...newRun, hours: e.target.value })}
            />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>時間</span>
            <input
              type="number"
              placeholder="分"
              min="0"
              max="59"
              value={newRun.minutes}
              onChange={(e) => setNewRun({ ...newRun, minutes: e.target.value })}
            />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>分</span>
            <input
              type="number"
              placeholder="秒"
              min="0"
              max="59"
              value={newRun.seconds}
              onChange={(e) => setNewRun({ ...newRun, seconds: e.target.value })}
            />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>秒</span>
          </div>

          {newRun.distance && totalSeconds > 0 && (
            <div className="previous-data">
              ペース: {formatPace(totalSeconds, Number(newRun.distance))}
            </div>
          )}

          <textarea
            placeholder="コメント（任意）"
            value={newRun.comment}
            onChange={(e) => setNewRun({ ...newRun, comment: e.target.value })}
            rows={2}
          />

          <button className="add-btn" onClick={handleSave}>{editRun ? '更新' : '追加'}</button>
          <button className="cancel-btn" onClick={() => {
            setShowForm(false);
            setNewRun(EMPTY_FORM);
            setEditRun(null);
          }}>
            <span className="material-symbols-outlined cancel">close_small</span>
          </button>
        </div>
      )}

      <div className="log">
        <h2 className="section-title">ランの記録</h2>
        {displayed.map(run => {
          const ts = run.timeSeconds ?? (run.time ?? 0) * 60;
          return (
            <div key={run.id} className="item-card">
              <div className="item-name">
                <div className="train-name" style={{ color: 'var(--run)' }}>{run.date}</div>
                <div className="table-action">
                  <button onClick={() => handleEdit(run)}>
                    <span className="material-symbols-outlined edit card-btn">edit</span>
                  </button>
                  <button onClick={() => handleDelete(run.id)}>
                    <span className="material-symbols-outlined delete card-btn">delete</span>
                  </button>
                </div>
              </div>
              <div className="item-sets">
                <span>{run.distance} km</span>
                <span style={{ margin: '0 8px', color: 'var(--muted)' }}>|</span>
                <span>{formatTime(ts)}</span>
                <span style={{ margin: '0 8px', color: 'var(--muted)' }}>|</span>
                <span style={{ color: 'var(--run)' }}>{formatPace(ts, run.distance)}</span>
                {run.comment && <div className="item-comment">{run.comment}</div>}
              </div>
            </div>
          );
        })}
        {sorted.length > LIMIT && (
          <button className="show-more-btn" onClick={() => setShowAllLog(v => !v)}>
            {showAllLog ? '閉じる' : `過去の記録をもっと見る（${sorted.length - LIMIT}件）`}
          </button>
        )}
      </div>
    </div>
  );
}

export default RunPage;
