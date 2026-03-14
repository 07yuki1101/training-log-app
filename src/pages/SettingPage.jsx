import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

function SettingPage({ user, exercises, setExercises }) {
  const [newExercises, setNewExercises] = useState('');

  const fetchExercises = async () => {
    const snap = await getDocs(
      collection(db, 'users', user.uid, 'exercises'));

    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setExercises(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchExercises();
  }, [user]);

  const handleAddExercise = async () => {
    if (!newExercises) return
    await addDoc(collection(db, 'users', user.uid, 'exercises'),
      {
        name: newExercises
      })
    setNewExercises('');
    fetchExercises();
  };

  const handleDeleteExercise = async (id) => {
    const ok = window.confirm('削除しますか？')
    if (!ok) return;
    await deleteDoc(
      doc(db, 'users', user.uid, 'exercises', id)
    );
    fetchExercises()
  }


  const [showForm, setShowForm] = useState(false);
  const [openExercise, setOpenExercise] = useState(false);

  return (
    <div className="setting">
      <h2 className="setting-title">設定</h2>
      <div className="setting-card">
        <button className="setting-btn" onClick={() => setShowForm(prev => !prev)}>種目追加</button>
      </div>
      {showForm && (
        <div className="form-box">
          <input type="text"
            placeholder="種目を追加"
            value={newExercises}
            onChange={(e) => setNewExercises(e.target.value)} />

          <button onClick={() => { handleAddExercise(); setShowForm(false) }}><span className="material-symbols-outlined">
add
</span></button>

        </div>
      )}
      <div className="setting-card">
        <button className="setting-btn" onClick={() => setOpenExercise(prev => !prev)}>種目一覧</button>
      </div>
      {openExercise && (
        <div className="exercise-list">
          {exercises.map(ex => (
            <div key={ex.id} className="exercise-items">
              <div className="exercise-item" >
                <span className="exercise-name">{ex.name}</span>
                <button className="delete-btn" onClick={() => handleDeleteExercise(ex.id)}><span className="material-symbols-outlined">
delete
</span></button>
              </div>
            </div>
          ))}

        </div>
      )}


    </div>
  )
}
export default SettingPage;