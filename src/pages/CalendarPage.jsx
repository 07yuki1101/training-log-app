import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"
import "../../src/calendar.css"

function CalendarPage({ records }) {


  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`
  }

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
      />
    </div>
  )
}
export default CalendarPage;