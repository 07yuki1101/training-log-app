import { useState, useEffect } from "react"

function App() {

  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false)
  const [newRecords, setNewRecords] = useState({
    date: '', exercise: '', weight: '', reps: '', sets: ''
  })
  const [edit, setEdit] = useState(null);
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem("records");
    if (saved) {
      setRecords(JSON.parse(saved))
    }
    setLoaded(true)
  }, []);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);

  const isInvalid =
    !newRecords.date ||
    !newRecords.exercise ||
    !newRecords.reps ||
    !newRecords.sets;

  const handleAddRecord = () => {
    if (edit) {
      const update = records.map(day => {
        if (day.date === edit.date) {
          return {
            ...day,
            items: day.items.map((item, i) => {
              if (i === edit.index) {
                return {
                  exercise: newRecords.exercise,
                  weight: newRecords.weight,
                  reps: newRecords.reps,
                  sets: newRecords.sets,
                }
              } return item;
            })
          };
        } return day;
      });
      setRecords(update);
      setEdit(null)
      setShowForm(false)
    } else {
      if (isInvalid) {
        alert('全て入力してください')
        return
      } else {
        const existing = records.find(r => r.date === newRecords.date)
        if (existing) {
          const update = records.map(record => {
            if (record.date === newRecords.date) {
              return {
                ...record, items: [...record.items,
                {
                  exercise: newRecords.exercise,
                  weight: newRecords.weight,
                  reps: newRecords.reps,
                  sets: newRecords.sets,
                }
                ]
              }
            } else {
              return record
            };
          });
          setRecords(update);
        } else {
          setRecords([
            ...records,
            {
              date: newRecords.date,
              items: [
                {
                  exercise: newRecords.exercise,
                  weight: newRecords.weight,
                  reps: newRecords.reps,
                  sets: newRecords.sets,
                }
              ]
            }
          ]);
        }

        setNewRecords({ date: '', exercise: '', weight: '', reps: '', sets: '' })
        setShowForm(false)
      }
    }
  }



  const handleDeleteItem = (date, index) => {
    const update = records.map(day => {
      if (day.date === date) {
        return {
          ...day,
          items: day.items.filter((_, i) => i !== index)
        }
      } return day;
    });
    setRecords(update)
  };

  const handleDeleteRecord = (date) => {
    const update = records.filter(day => day.date !== date);
    setRecords(update);
  };

  return (
    <div>
      <header>
        <h1>Training Log</h1>
      </header>
      {!showForm && (
        <div className="form-switch">
          <button className="add-btn" onClick={() => setShowForm(true)}>データを追加</button>
        </div>
      )}

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

          <button className="add-btn" onClick={handleAddRecord}>追加</button>
          <button className="cancel-btn" onClick={() => setShowForm(false)}>×</button>
        </div>
      )}

      <div className="log">
        <h2 className="section-title">トレーニング記録</h2>
        {[...records]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => (
            <div key={day.date}>
              <h3 className="date">
                {day.date}
                <button onClick={() => handleDeleteRecord(day.date)}>削除</button>
              </h3>
              <table>
                <tbody>
                  {day.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.exercise}</td>
                      <td>{item.weight} kg</td>
                      <td>{item.reps} 回</td>
                      <td>{item.sets} セット</td>
                      <td><button onClick={() => {
                        setEdit({ date: day.date, index: i });
                        setNewRecords({
                          date: day.date,
                          exercise: item.exercise,
                          weight: item.weight,
                          reps: item.reps,
                          sets: item.sets
                        });
                        setShowForm(true)
                      }}>編集</button><button onClick={() => handleDeleteItem(day.date, i)}>削除</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        <h3>{ }</h3>
      </div>

    </div>
  )
}

export default App
