import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase"
import { useEffect, useState, } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
function WeightPage({ user }) {
  const [weight, setWeight] = useState(() => {
    const saved = localStorage.getItem("weight");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [newWeight, setNewWeight] = useState({
    date: '', bw: ''
  });

  useEffect(() => {
    if (!user) return;

    const fetchWeight = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, 'users', user.uid, 'weights')
        );
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWeight(data);
      } catch (error) {
        console.error('Firestore読み込みエラー', error);
      }
    };
    fetchWeight();
  }, [user]);

  // useEffect(() => {
  //   localStorage.setItem("weight", JSON.stringify(weight));
  // }, [weight]);

  const handleAddWeight = async () => {
    console.log('user:',user)
    console.log('newWeight:',newWeight)
    if (!newWeight.bw) {
      alert('体重を入力してください')
      return
    }
    try {
      await addDoc(
        collection(db, 'users', user.uid, 'weights'),
        {
          date: newWeight.date,
          bw: Number(newWeight.bw),
        }
      );

      const querySnapshot = await getDocs(
        collection(db, 'users', user.uid, 'weights')
      );

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setWeight(data);

      setNewWeight({ date: '', bw: '' });
      setShowForm(false);

    } catch (error) {
      console.error('firestore保存エラー:', error);
    }

  };
  const handleDelete = (date) => {
    const ok = window.confirm("この記録を消しますか？");
    if (!ok) return;
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

  return (
    <div>
      <div >
        {!showForm && (
          <div className="form-switch">
            <button className="add-btn" onClick={() => setShowForm(true)}>体重を追加</button>
          </div>
        )}

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
            <button className="cancel-btn" onClick={() => { setShowForm(false); setNewWeight({ date: '', bw: '' }) }}>×</button>
          </div>
        )}

      </div>
      <div >

        <div className="graph">
          <div className="graph-switch">
            <button onClick={() => setRange(30)}>1ヶ月</button>
            <button onClick={() => setRange(180)}>6ヶ月</button>
            <button onClick={() => setRange(365)}>1年</button>
          </div>
          <div className="graph-style">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={filteredWeight}>
                <XAxis dataKey="date"
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    const month = d.getMonth() + 1;
                    const day = String(d.getDate()).padStart(2, "0");
                    return `${month}.${day}`;
                  }}></XAxis>
                <YAxis domain={['dataMin - 5', 'dataMax +5']}></YAxis>
                <Line dataKey="bw"></Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="weight-log">
          <h2 className="section-title">体重記録</h2>
          <table>
            <tbody>
              {[...weight]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(day => (
                  <tr key={day.date} className="date">
                    <td>{day.date}</td>
                    <td>{day.bw} kg</td>
                    <td><button onClick={() => handleDelete(day.date)}><span className="material-symbols-outlined delete">
                      delete
                    </span></button></td>
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