import { useEffect, useState, } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
function WeightPage() {
  const [weight, setWeight] = useState(() => {
    const saved = localStorage.getItem("weight");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [newWeight, setNewWeight] = useState({
    date: '', bw: ''
  });

  useEffect(() => {
    localStorage.setItem("weight", JSON.stringify(weight));
  }, [weight]);

  const handleAddWeight = () => {
    if (!newWeight.bw) {
      alert('体重を入力してください')
      return
    } else {
      setWeight([
        ...weight,
        {
          date: newWeight.date,
          bw: Number(newWeight.bw)
        }
      ])
      setNewWeight({ date: '', bw: '' });
      setShowForm(false);
    };
  };
  const handleDelete = (date) => {
    const update = weight.filter(day => day.date !== date);
    setWeight(update);
  }
  const [range, setRange] = useState(30);
  const filteredWeight = weight
    .filter(item => {
      const today = new Date();
      const date = new Date(item.date);
      const displayDate = (today - date) / (1000 * 60 * 60 * 24);
      return displayDate <= range;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log(weight);
  console.log(filteredWeight);
  console.log(range);
  return (
    <div>
      <div>
        <div className="form-switch">
          <button className="add-btn" onClick={() => setShowForm(true)}>体重を追加</button>
        </div>
        {showForm && (
          <div className="form">
            <input type="date"
              value={newWeight.date}
              onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })} />

            <input type="number"
              placeholder="体重"
              value={newWeight.bw}
              onChange={(e) => setNewWeight({ ...newWeight, bw: e.target.value })} />

            <button className="add-btn" onClick={handleAddWeight}>追加</button>
          </div>
        )}
      </div>
      <div className="log">
        <h2 className="section-title">体重記録</h2>
        <div className="graph">
          <button onClick={() => setRange(30)}>1ヶ月</button>
          <button onClick={() => setRange(180)}>6ヶ月</button>
          <button onClick={() => setRange(365)}>1年</button>
          <ResponsiveContainer>
            <LineChart data={filteredWeight}>
              <XAxis dataKey="date"
                tickFormatter={(value) => {
                  const d = new Date(value);
                  const month = d.getMonth() + 1;
                  const day = String(d.getDate()).padStart(2, "0");
                  return `${month}.${day}`;
                }}></XAxis>
              <YAxis domain={['dataMin - 5','dataMax +5']}></YAxis>
              <Line dataKey="bw"></Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="log">
          <table>
            <tbody>
              {[...weight]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(day => (
                  <tr key={day.date} className="date">
                    <td>{day.date}</td>
                    <td>{day.bw} kg</td>
                    <td><button onClick={() => handleDelete(day.date)}>削除</button></td>
                  </tr>
                ))
              }

            </tbody>
          </table>
          
        </div>
      </div>
    </div>
  )
}
export default WeightPage;