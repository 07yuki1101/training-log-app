import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

function MealPage({ user }) {
  const [meals, setMeals] = useState(() => {
    const saved = localStorage.getItem("meals");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [newMeal, setNewMeal] = useState({
    date: '', timing: '', calories: '', protein: ''
  })
  const timingList = [
    { id: 0, time: '朝食' },
    { id: 1, time: '昼食' },
    { id: 2, time: '夕食' },
    { id: 3, time: '間食' },
  ];
  const [editMeal, setEditMeal] = useState(null);
  const fetchMeals = async () => {
    const querySnapshot = await getDocs(
      collection(db, 'users', user.uid, 'meals')
    );
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMeals(data);

  };

  useEffect(() => {
    if (!user) return;
    fetchMeals();
  }, [user])



  const handleAddMeals = async () => {
    if (!user) return;
    if (!newMeal.date || !newMeal.timing) {
      alert('日付とタイミングは必須です');
      return;
    }

    try {
      if (editMeal) {
        await updateDoc(
          doc(db, 'users', user.uid, 'meals', editMeal.id),
          {
            date: newMeal.date,
            timing: newMeal.timing,
            calories: Number(newMeal.calories),
            protein: Number(newMeal.protein),
          }
        )
      } else {
        await addDoc(
          collection(db, 'users', user.uid, 'meals'),
          {
            date: newMeal.date,
            timing: newMeal.timing,
            calories: Number(newMeal.calories),
            protein: Number(newMeal.protein),
          }
        );
      }

      await fetchMeals();
      setNewMeal({ date: '', timing: '', calories: '', protein: '' });
      setEditMeal(null)
      setShowForm(false);
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const handleDeleteMeal = async (date) => {
    const ok = window.confirm("この記録を消しますか？");
    if (!ok) return;
    const targets = meals.filter(m => m.date === date);
    await Promise.all(
      targets.map(m =>
        deleteDoc(doc(db, 'users', user.uid, 'meals', m.id))
      )
    );

    fetchMeals();
  }
  const handleDeleteFood = async (foodId) => {
    const ok = window.confirm('削除しますか？');
    if (!ok) return;

    await deleteDoc(
      doc(db, 'users', user.uid, 'meals', foodId)
    );
    fetchMeals();
  }

  const [openDate, setOpenDate] = useState([]);

  const toggleDate = (date) => {
    setOpenDate(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };


  const groupedMeals = meals.reduce((acc, meal) => {
    if (!acc[meal.date]) {
      acc[meal.date] = {
        date: meal.date,
        foods: []
      };
    }
    acc[meal.date].foods.push(meal);
    return acc;
  }, {});
  return (
    <div>

      {!showForm &&
        <div className="form-switch">
          <button className="add-btn" onClick={() => setShowForm(true)}>食事を追加</button>
        </div>
      }
      {showForm && (
        <div className="form">
          <input type="date"
            value={newMeal.date}
            onChange={(e) => setNewMeal({ ...newMeal, date: e.target.value })} />

          <select value={newMeal.timing}
            onChange={(e) => setNewMeal({ ...newMeal, timing: e.target.value })}>
            <option value="">選択</option>
            {timingList.map(t => (
              <option key={t.id} value={t.time}>{t.time}</option>
            ))}
          </select>

          <input type="number"
            value={newMeal.calories}
            placeholder="カロリー"
            onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })} />

          <input type="number"
            value={newMeal.protein}
            placeholder="たんぱく質"
            onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })} />
          <button className="add-btn" onClick={handleAddMeals}>{editMeal ? '更新' : '追加'}</button>
          {/* {edit && (<button className="add-btn" onClick={handleAddMeals}>更新</button>)} */}

          <button className="cancel-btn" onClick={() => { setShowForm(false); setNewMeal({ date: '', timing: '', calories: '', protein: '' }); setEditMeal(null) }}>×</button>
        </div>
      )}

      <div className="log">
        <h2 className="section-title">食事記録</h2>
        {Object.values(groupedMeals)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => (
            <div key={day.date}>
              <div className="date">
                <h3>{day.date}</h3>
                <p className="total">
                  カロリー: {day.foods.reduce((sum, f) => sum + Number(f.calories), 0)} kcal
                  たんぱく質: {day.foods.reduce((sum, f) => sum + Number(f.protein), 0)} g
                </p>
                <button onClick={() => handleDeleteMeal(day.date)}><span className="material-symbols-outlined delete">
                  delete
                </span></button>
                <button onClick={() => toggleDate(day.date)}>{openDate.includes(day.date) ? <span className="material-symbols-outlined arrow">
                      keyboard_arrow_up
                    </span> : <span className="material-symbols-outlined arrow">
                      keyboard_arrow_down
                    </span>}</button>
              </div>
              {openDate.includes(day.date) && (
                <table>
                  <tbody>
                    {day.foods.map(food => (
                      <tr key={food.id}>
                        <td>{food.timing}</td>
                        <td>{food.calories}</td>
                        <td>{food.protein}</td>
                        <td>
                          <button onClick={() => handleDeleteFood(food.id)}><span className="material-symbols-outlined delete">
                            delete
                          </span></button>
                          <button onClick={() => {
                            setEditMeal(food); setNewMeal({
                              date: day.date,
                              timing: food.timing,
                              calories: food.calories,
                              protein: food.protein
                            })
                            setShowForm(true)
                          }}><span className="material-symbols-outlined edit">
                              edit
                            </span></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          ))
        }

      </div>
    </div>
  )
}
export default MealPage;