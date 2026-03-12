import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"
import "../../src/calendar.css"
function CalendarPage({user}){

  return(
    <div>
      <Calendar 
      formatDay={(local,date)=>date.getDate()}/>
    </div>
  )
}
export default CalendarPage;