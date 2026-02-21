import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp} from "firebase/firestore";
import { db } from "../firebase";

function TrainingPage({ user }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newRecords, setNewRecords] = useState({
    date: '', exercise: '', weight: '', reps: '', sets: ''
  });

  const [editRecord, setEditRecord] = useState(null);

  const fetchRecords = async () => {
    const q = query(
      collection(db, 'users', user.uid, 'records'),
      orderBy('createdAt','asc')
    );
    const querySnapshot = await getDocs(q);

    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setRecords(data);
  }

  useEffect(() => {
    if (!user) return;
    fetchRecords();
  }, [user]);

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]
  }

  const handleAddRecord = async () => {
    console.log('handleAddRecords Start', newRecords);
    if (!user) {
      console.log('user is null')
      return;
    }
    if (!newRecords.date) {
      alert('日付を入れてください');
      return;
    }
    try {
      if (editRecord) {
        await updateDoc(
          doc(db, 'users', user.uid, 'records', editRecord.id),
          {
            date: newRecords.date,
            exercise: newRecords.exercise,
            weight: Number(newRecords.weight),
            reps: Number(newRecords.reps),
            sets: Number(newRecords.sets),
            createdAt:serverTimestamp(),
            updatedAt:serverTimestamp()
          }
        );
      } else {
        await addDoc(
          collection(db, 'users', user.uid, 'records'),
          {
            date: newRecords.date,
            exercise: newRecords.exercise,
            weight: Number(newRecords.weight),
            reps: Number(newRecords.reps),
            sets: Number(newRecords.sets),
            createdAt:serverTimestamp(),
            updatedAt:serverTimestamp()
          }
        );
      }

      await fetchRecords();
      setNewRecords({ date: '', exercise: '', weight: '', reps: '', sets: '' });
      setEditRecord(null)
      setShowForm(false);
      console.log('✅ handleAddRecord END');
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const handleDeleteDate = async (date) => {
    const ok = window.confirm('削除しますか？')
    if (!ok) return;
    const target = records.filter(r => r.date === date)
    await Promise.all(
      target.map(r =>
        deleteDoc(doc(db, 'users', user.uid, 'records', r.id))
      )
    );
    fetchRecords();
  }

  const handleDeleteItem = async (itemId) => {
    const ok = window.confirm('削除しますか？')
    if (!ok) return;
    await deleteDoc(doc(db, 'users', user.uid, 'records', itemId));
    fetchRecords();
  }

  const [openItem, setOpenItem] = useState([]);
  const toggleItem = (date) => {
    setOpenItem(prev =>
      prev.includes(date)
        ? prev.filter(i => i !== date)
        : [...prev, date]
    );
  }

  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = {
        date: record.date,
        items: []
      };
    }
    acc[record.date].items.push(record);
    return acc;
  }, {})





  return (
    <div>
      {!showForm &&
        <div className="form-switch">
          <button className="add-btn" onClick={() => {setShowForm(true);
            setNewRecords(prev=>({
              ...prev,date:getToday()
            }))}}>トレーニングを追加</button>
        </div>
      }
      {showForm && (
        <div className="form">
          <input type="date"
            value={newRecords.date}
            onChange={(e) => setNewRecords({ ...newRecords, date: e.target.value })} />

          <input type="text"
            placeholder="種目"
            value={newRecords.exercise}
            onChange={(e) => setNewRecords({ ...newRecords, exercise: e.target.value })} />

          <input type="number"
            placeholder="重さ（kg）"
            value={newRecords.weight}
            onChange={(e) => setNewRecords({ ...newRecords, weight: e.target.value })} />

          <input type="number"
            placeholder="回数"
            value={newRecords.reps}
            onChange={(e) => setNewRecords({ ...newRecords, reps: e.target.value })} />

          <input type="number"
            placeholder="セット数"
            value={newRecords.sets}
            onChange={(e) => setNewRecords({ ...newRecords, sets: e.target.value })} />

          <button className="add-btn" onClick={handleAddRecord}>{editRecord ? '更新' : '追加'}</button>

          <button className="cancel-btn" onClick={() => { setShowForm(false); setNewRecords({ date: '', exercise: '', weight: '', reps: '', sets: '' }) }}>×</button>
        </div>
      )}

      <div className="log">
        <h2 className="section-title">トレーニング記録</h2>
        {Object.values(groupedRecords)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => (
            <div key={day.date}>
              <div className="date">
                <h3>{day.date}</h3>
                <div>
                  <button onClick={() => handleDeleteDate(day.date)}><span className="material-symbols-outlined delete">
                    delete
                  </span></button>
                  <button onClick={() => toggleItem(day.date)}>{openItem.includes(day.date) ? <span className="material-symbols-outlined arrow">
                    keyboard_arrow_up
                  </span> : <span className="material-symbols-outlined arrow">
                    keyboard_arrow_down
                  </span>}</button>
                </div>
              </div>
              {openItem.includes(day.date) && (
                <div>
                  {day.items.map(item => (

                    <div key={item.id} className="item-card">
                      <div className="item-name">
                        <div className="train-name">{item.exercise}</div>
                        <div className="table-action"><button onClick={() => {
                          setShowForm(true); setEditRecord(item); setNewRecords({
                            date: day.date,
                            exercise: item.exercise,
                            weight: item.weight,
                            reps: item.reps,
                            sets: item.sets,
                          })
                        }}><span className="material-symbols-outlined edit">
                            edit
                          </span></button><button onClick={() => handleDeleteItem(item.id)}><span className="material-symbols-outlined delete">
                            delete
                          </span></button></div>
                      </div>
                      <div className="item-counts">
                        <div className="train-weight">{item.weight} kg</div>
                        <div className="train-reps">{item.reps} 回</div>
                        <div className="train-sets">{item.sets} set</div>
                      </div>
                    </div>
                  ))}

                </div>


              )}

            </div>
          ))
        }
      </div>

    </div>

  );
}
export default TrainingPage;