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
    <div>
      <h2>設定</h2>
      <div><button onClick={() => setShowForm(true)}>種目追加</button></div>
      {showForm && (
        <div>
          <input type="text"
            placeholder="種目を追加"
            value={newExercises}
            onChange={(e) => setNewExercises(e.target.value)} />

          <button onClick={() => { handleAddExercise(); setShowForm(false) }}>追加</button>
          <button onClick={()=>setShowForm(false)}>キャンセル</button>
        </div>
      )}
      <div><button onClick={() => setOpenExercise(true)}>種目一覧</button></div>
      {openExercise && (
        <div>
          {exercises.map(ex => (
            <div key={ex.id}>
              <span>{ex.name}</span>
              <button onClick={() => handleDeleteExercise(ex.id)}>削除</button>
            </div>
          ))}
          <button onClick={()=>setOpenExercise(false)}>閉じる</button>
        </div>
      )}

      
    </div>
  )
}
export default SettingPage;