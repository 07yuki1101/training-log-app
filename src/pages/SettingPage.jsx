import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const BODY_PARTS = ['胸', '背中', '肩', '腕', '脚', '腹筋', 'その他'];

function SettingPage({ user, exercises, setExercises }) {
  const [newName, setNewName] = useState('');
  const [newBodyPart, setNewBodyPart] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBodyPart, setEditBodyPart] = useState('');

  const fetchExercises = async () => {
    const snap = await getDocs(collection(db, 'users', user.uid, 'exercises'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setExercises(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchExercises();
  }, [user]);

  const handleAddExercise = async () => {
    if (!newName || !newBodyPart) return;
    await addDoc(collection(db, 'users', user.uid, 'exercises'), {
      name: newName,
      bodyPart: newBodyPart,
    });
    setNewName('');
    setNewBodyPart('');
    fetchExercises();
  };

  const handleDeleteExercise = async (id) => {
    const ok = window.confirm('削除しますか？');
    if (!ok) return;
    await deleteDoc(doc(db, 'users', user.uid, 'exercises', id));
    fetchExercises();
  };

  const startEdit = (ex) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditBodyPart(ex.bodyPart || '');
  };

  const handleUpdateExercise = async () => {
    if (!editName || !editBodyPart) return;
    await updateDoc(doc(db, 'users', user.uid, 'exercises', editingId), {
      name: editName,
      bodyPart: editBodyPart,
    });
    setEditingId(null);
    fetchExercises();
  };

  const [showForm, setShowForm] = useState(false);
  const [openExercise, setOpenExercise] = useState(false);

  const grouped = exercises.reduce((acc, ex) => {
    const part = ex.bodyPart || 'その他';
    if (!acc[part]) acc[part] = [];
    acc[part].push(ex);
    return acc;
  }, {});

  const allParts = [...BODY_PARTS.filter(p => grouped[p]),
    ...Object.keys(grouped).filter(p => !BODY_PARTS.includes(p))];

  const renderExerciseItem = (ex) => {
    if (editingId === ex.id) {
      return (
        <div key={ex.id} className="exercise-item exercise-item--editing">
          <div className="exercise-edit-fields">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <select
              value={editBodyPart}
              onChange={(e) => setEditBodyPart(e.target.value)}
            >
              <option value="">部位を選択</option>
              {BODY_PARTS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="exercise-edit-actions">
            <button className="ex-save-btn" onClick={handleUpdateExercise} disabled={!editName || !editBodyPart}>
              <span className="material-symbols-outlined">check</span>
            </button>
            <button className="ex-cancel-btn" onClick={() => setEditingId(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={ex.id} className="exercise-item">
        <span className="exercise-name">{ex.name}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="ex-edit-btn" onClick={() => startEdit(ex)}>
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button className="ex-delete-btn" onClick={() => handleDeleteExercise(ex.id)}>
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="setting">
      <h2 className="setting-title">設定</h2>
      <div className="setting-card">
        <button className="setting-btn" onClick={() => setShowForm(prev => !prev)}>種目追加</button>
      </div>
      {showForm && (
        <div className="add-exercise-form">
          <input
            type="text"
            placeholder="種目名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select
            value={newBodyPart}
            onChange={(e) => setNewBodyPart(e.target.value)}
          >
            <option value="">部位を選択</option>
            {BODY_PARTS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={() => { handleAddExercise(); setShowForm(false); }}
            disabled={!newName || !newBodyPart}
          >
            追加
          </button>
        </div>
      )}
      <div className="setting-card">
        <button className="setting-btn" onClick={() => setOpenExercise(prev => !prev)}>種目一覧</button>
      </div>
      {openExercise && (
        <div className="exercise-list">
          {allParts.map(part => (
            <div key={part} className="exercise-items">
              <div className="exercise-group-label">{part}</div>
              {grouped[part].map(ex => renderExerciseItem(ex))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SettingPage;
