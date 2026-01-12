import { useState } from "react"

function App() {
  const [records, setRecords] = useState([]);
  const [newRecords, setNewRecords] = useState({
    date: '', exercise: '', weight: '', reps: '', sets: ''
  })
  const handleAddRecord = () => {
    if(!newRecords.date|| !newRecords.exercise|| !newRecords.weight|| !newRecords.reps|| !newRecords.sets){
      alert('全て入力してください')
    }else{
    setRecords([...records, newRecords])
    setNewRecords({ date: '', exercise: '', weight: '', reps: '', sets: '' })
  }
  };
  return (
    <div>
      <header>
      <h1>Training Log</h1>
      </header>
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
          onChange={(e)=>setNewRecords({...newRecords,reps:e.target.value})} />

          <input type="number"
          placeholder="セット数"
          value={newRecords.sets}
          onChange={(e)=>setNewRecords({...newRecords,sets:e.target.value})} />

        <button onClick={handleAddRecord}>追加</button>
      </div>
      <div className="log">
      <table>
        <thead>
          <tr>
            <th>日付</th>
            <th>種目</th>
            <th>重さ</th>
            <th>回数</th>
            <th>セット数</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) =>
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.exercise}</td>
              <td>{r.weight}kg</td>
              <td>{r.reps}回</td>
              <td>{r.sets}セット</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default App
