import { useState, useEffect } from "react";

function MealPage() {
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


  useEffect(() => {
    localStorage.setItem("meals", JSON.stringify(meals));
  }, [meals])
  const [edit, setEdit] = useState(null);
  const noDate =
    !newMeal.date;

  const handleAddMeals = () => {
    if (noDate) {
      alert('日付を入れてください')
      return
    }
    if (edit) {
      const update = meals.map(meal => {
        if (meal.date === edit.date) {
          return {
            ...meal,
            foods: meal.foods.map((food, i) => {
              if (i === edit.index) {
                return {
                  timing: newMeal.timing,
                  calories: Number(newMeal.calories),
                  protein: Number(newMeal.protein),
                }
              } return food;
            })
          };
        } return meal;
      });
      setMeals(update);


    } else {
      const sameDate = meals.find(m => m.date === newMeal.date)
      if (sameDate) {
        const update = meals.map(meal => {
          if (meal.date === newMeal.date) {
            return {
              ...meal, foods: [...meal.foods,
              {
                timing: newMeal.timing,
                calories: Number(newMeal.calories),
                protein: Number(newMeal.protein),
              }
              ]
            };
          } return meal;
        })
        setMeals(update);
      } else {
        setMeals([
          ...meals,
          {
            date: newMeal.date,
            foods: [
              {
                timing: newMeal.timing,
                calories: Number(newMeal.calories),
                protein: Number(newMeal.protein),
              }
            ]
          }
        ])
      };
    }
    setNewMeal({ date: '', timing: '', calories: '', protein: '' });
    setShowForm(false);
    setEdit(null);
  };
  const handleDeleteMeal = (date) => {
    const update = meals.filter(day => day.date !== date)
    setMeals(update)
  }
  const handleDeleteFood = (date, index) => {
    const update = meals.map(day => {
      if (day.date === date) {
        return {
          ...day,
          foods: day.foods.filter((_, i) => i !== index)
        }
      } return day;
    })
    setMeals(update);
  }

  const [openDate, setOpenDate] = useState([]);
  const handleOpen = (date) => {
    setOpenDate(prev => {
      if (prev.includes(date)) {
        return prev;
      } return [...prev, date];
    });
  };
  const handleClose = (date) => {
    setOpenDate(prev => prev.filter(d => d !== date));
  };

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
          {!edit && (<button className="add-btn" onClick={handleAddMeals}>追加</button>)}
          {edit && (<button className="add-btn" onClick={handleAddMeals}>更新</button>)}

          <button className="cancel-btn" onClick={() => { setShowForm(false); setEdit(null); setNewMeal({ date: '', timing: '', calories: '', protein: '' }) }}>×</button>
        </div>
      )}

      <div className="log">
        <h2 className="section-title">食事記録</h2>
        {[...meals]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => (
            <div key={day.date} >
              <div className="date">
                <h3 >{day.date} <button onClick={() => handleDeleteMeal(day.date)}>削除</button>
                {openDate.includes(day.date)
                ?(<button onClick={() => handleClose(day.date)}>↑</button>)
              :(<button onClick={() => handleOpen(day.date)}>↓</button>)}
                </h3>

                <p className="total">カロリー : {day.foods.reduce((sum, food) => sum + Number(food.calories), 0)} kcal <span>　</span> たんぱく質 : {day.foods.reduce((sum, food) => sum + Number(food.protein), 0)} g</p>

              </div>
              {openDate.includes(day.date) && (
                <div>
                    <div>
                      <table>
                        <tbody>
                          {day.foods.map((food, i) => (
                            <tr key={i}>
                              <td>{food.timing}</td>
                              <td>{food.calories} kcal</td>
                              <td>{food.protein} g</td>
                              <td><button onClick={() => {
                                setEdit({ date: day.date, index: i })
                                setNewMeal({
                                  date: day.date,
                                  timing: food.timing,
                                  calories: food.calories,
                                  protein: food.protein
                                })
                                setShowForm(true)
                              }}>編集</button><button onClick={() => handleDeleteFood(day.date, i)}>削除</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  

                </div>
              )}
              
            </div>
          ))
        }
      </div>
    </div>
  )
}
export default MealPage;