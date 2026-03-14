import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

function TrainingPage({ user, exercises, records, setRecords, fetchRecords }) {

  const [showForm, setShowForm] = useState(false);
  const [newRecords, setNewRecords] = useState({
    date: '', exercise: '', sets: [{ weight: '', reps: '' }]
  });

  const [editRecord, setEditRecord] = useState(null);



  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]
  };



  const handleeAddSet = () => {
    setNewRecords(prev => ({
      ...prev, sets: [...prev.sets, { weight: '', reps: '' }]
    }))
  };

  const handleRemoveSet = (index) => {
    setNewRecords(prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index)
    }))
  };

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
            sets: newRecords.sets.map(set => ({
              weight: Number(set.weight),
              reps: Number(set.reps)
            })),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        );
      } else {
        await addDoc(
          collection(db, 'users', user.uid, 'records'),
          {
            date: newRecords.date,
            exercise: newRecords.exercise,
            sets: newRecords.sets.map(set => ({
              weight: Number(set.weight),
              reps: Number(set.reps)
            })),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        );
      }

      await fetchRecords(user.uid);
      setNewRecords({ date: '', exercise: '', sets: [{ weight: '', reps: '' }] });
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
    await fetchRecords(user.uid);
  }

  const handleDeleteItem = async (itemId) => {
    const ok = window.confirm('削除しますか？')
    if (!ok) return;
    await deleteDoc(doc(db, 'users', user.uid, 'records', itemId));
    await fetchRecords(user.uid);
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

  const getPreviousRecord = (exercise) => {
    const previous = records
      .filter(r => r.exercise === exercise)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return previous[0]
  };

  const previous = getPreviousRecord(newRecords.exercise);

  useEffect(() => {
    if (!newRecords.exercise) return;

    const previous = getPreviousRecord(newRecords.exercise);
    if (previous) {
      setNewRecords(prev => ({
        ...prev,
        sets: previous.sets.map(set => ({
          weight: Number(set.weight),
          reps: ''
        }))
      }));
    }
    else {
      setNewRecords(prev => ({
        ...prev,
        sets: [{ weight: '', reps: '' }]
      }));
    }
  }, [newRecords.exercise])

  return (
    <div>
      {!showForm &&
        <div className="form-switch">
          <button className="add-btn" onClick={() => {
            setShowForm(true);
            setNewRecords(prev => ({
              ...prev, date: getToday()
            }))
          }}>トレーニングを追加</button>
        </div>
      }
      {showForm && (
        <div className="form">
          <input type="date"
            value={newRecords.date}
            onChange={(e) => setNewRecords({ ...newRecords, date: e.target.value })} />


          <select
            value={newRecords.exercise}
            onChange={(e) => setNewRecords({ ...newRecords, exercise: e.target.value })}>
            <option value="">種目</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.name}>{ex.name}</option>
            ))}
          </select>
          {previous && (
            <div className="previous-data">
              前回
              {previous.sets.map((set, i) => (
                <div className="previous-sets" key={i}>
                  {set.weight} kg × {set.reps}
                </div>
              ))}
            </div>
          )}
          {newRecords.sets.map((set, index) => (
            <div key={index} className="set-row">
              <input type="number"
                placeholder="重さ（kg）"
                value={set.weight}
                onChange={(e) => {
                  const updated = [...newRecords.sets]
                  updated[index].weight = e.target.value
                  setNewRecords({ ...newRecords, sets: updated })
                }} />

              <input type="number"
                placeholder="回数"
                value={set.reps}
                onChange={(e) => {
                  const updated = [...newRecords.sets]
                  updated[index].reps = e.target.value
                  setNewRecords({ ...newRecords, sets: updated })
                }} />

              <button className="cancel-btn" onClick={() => handleRemoveSet(index)}><span className="material-symbols-outlined set-btn cancel">
                remove
              </span></button>
            </div>

          ))}

          <div className="set-count">
            <button className="set-btn" onClick={handleeAddSet}><span className="material-symbols-outlined set-add">
              add
            </span></button>

          </div>

          <button className="add-btn" onClick={handleAddRecord}>{editRecord ? '更新' : '追加'}</button>

          <button className="cancel-btn" onClick={() => { setShowForm(false); setNewRecords({ date: '', exercise: '', sets: [{ weight: '', reps: '' }] }) }}><span className="material-symbols-outlined cancel">
            close_small
          </span></button>
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
                <div className="table-action">
                  <button onClick={() => handleDeleteDate(day.date)}><span className="material-symbols-outlined delete small-btn">
                    delete
                  </span></button>
                  <button onClick={() => toggleItem(day.date)}>{openItem.includes(day.date) ? <span className="material-symbols-outlined arrow small-btn">
                    keyboard_arrow_up
                  </span> : <span className="material-symbols-outlined arrow small-btn">
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
                        <div className="table-action">
                          <button onClick={() => {
                            setShowForm(true); setEditRecord(item); setNewRecords({
                              date: day.date,
                              exercise: item.exercise,
                              sets: item.sets,
                            })
                          }}><span className="material-symbols-outlined edit card-btn">
                              edit
                            </span></button><button onClick={() => handleDeleteItem(item.id)}><span className="material-symbols-outlined delete card-btn">
                              delete
                            </span></button></div>
                      </div>
                      <div className="item-sets">
                        {item.sets.map((set, i) => (
                          <div key={i}>
                            {set.weight} kg × {set.reps}
                          </div>
                        ))}

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