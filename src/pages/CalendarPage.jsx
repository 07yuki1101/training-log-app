import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"
import "../../src/calendar.css"
import { useState } from "react";

function CalendarPage({ records }) {


  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`
  }

  const [selectedDate, setSelectedDate] = useState(null);
  const dayRecords = records.filter(
    r => r.date === selectedDate
  )
  return (
    <div>
      <Calendar
        formatDay={(local, date) => date.getDate()}
        showNeighboringMonth={false}

        tileContent={({ date, view }) => {
          const formatted = formatDate(date)
          const hasTraining = records?.some(
            r => r.date === formatted
          )
          if (view === 'month' && hasTraining) {
            return <div className="dot"></div>
          }
        }}
        onClickDay={(date) => {
          const formatted = formatDate(date)
          setSelectedDate(formatted)
        }}
      />

      {selectedDate &&
        <div className="modal-overlay">
          <div className="modal">
            <div className="day-training">
              <h3>{selectedDate}</h3>
              {dayRecords.map(r => (
                <div key={r.id} className="day-item">
                  <div className="exercise">
                    {r.exercise}
                  </div>
                  {r.sets.map((set, i) => (
                    <div key={i} className="sets">
                      {set.weight} kg × {set.reps}
                    </div>
                  ))}
                </div>

              ))}
            </div>
            <button onClick={()=>setSelectedDate(null)}>閉じる</button>
          </div>
        </div>

      }
    </div>
  )
}
export default CalendarPage;