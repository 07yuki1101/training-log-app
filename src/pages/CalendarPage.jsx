import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"
import "../../src/calendar.css"
import { useState } from "react";

const formatPace = (timeSeconds, distance) => {
  if (!distance || distance === 0) return '-';
  const totalMinutes = timeSeconds / 60;
  const pace = totalMinutes / distance;
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}'${String(sec).padStart(2, '0')}"/km`;
};

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}時間${m}分${s}秒`;
  return `${m}分${s}秒`;
};

const toYearMonth = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

function MonthlySummary({ records, runRecords, yearMonth }) {
  const monthRecords = records.filter(r => r.date?.startsWith(yearMonth));
  const monthRuns = (runRecords || []).filter(r => r.date?.startsWith(yearMonth));

  const trainDays = new Set(monthRecords.map(r => r.date)).size;
  const runDays = new Set(monthRuns.map(r => r.date)).size;
  const totalDistance = monthRuns.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalRunSeconds = monthRuns.reduce((sum, r) => sum + (r.timeSeconds ?? (r.time ?? 0) * 60), 0);
  const avgPace = totalDistance > 0 ? formatPace(totalRunSeconds, totalDistance) : '-';

  return (
    <div className="monthly-summary">
      <div className="summary-card">
        <span className="material-symbols-outlined summary-icon" style={{ color: 'var(--training)' }}>exercise</span>
        <div className="summary-body">
          <div className="summary-label">筋トレ</div>
          <div className="summary-value" style={{ color: 'var(--training)' }}>
            {trainDays}<span className="summary-unit">日</span>
          </div>
        </div>
      </div>
      <div className="summary-divider" />
      <div className="summary-card">
        <span className="material-symbols-outlined summary-icon" style={{ color: 'var(--run)' }}>directions_run</span>
        <div className="summary-body">
          <div className="summary-label">ラン</div>
          <div className="summary-value" style={{ color: 'var(--run)' }}>
            {runDays}<span className="summary-unit">日</span>
          </div>
          {totalDistance > 0 && (
            <div className="summary-sub">
              {totalDistance.toFixed(1)} km・{avgPace}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarPage({ records, runRecords }) {
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState(null);
  const [activeYearMonth, setActiveYearMonth] = useState(toYearMonth(new Date()));

  const dayRecords = records.filter(r => r.date === selectedDate);
  const dayRuns = (runRecords || []).filter(r => r.date === selectedDate);

  return (
    <div>
      <MonthlySummary
        records={records}
        runRecords={runRecords}
        yearMonth={activeYearMonth}
      />
      <Calendar
        formatDay={(local, date) => date.getDate()}
        showNeighboringMonth={false}
        onActiveStartDateChange={({ activeStartDate }) =>
          setActiveYearMonth(toYearMonth(activeStartDate))
        }
        tileContent={({ date, view }) => {
          const formatted = formatDate(date);
          const hasTraining = records?.some(r => r.date === formatted);
          const hasRun = runRecords?.some(r => r.date === formatted);
          if (view === 'month' && (hasTraining || hasRun)) {
            return (
              <div className="dot-wrapper">
                {hasTraining && <div className="dot"></div>}
                {hasRun && <div className="dot-run"></div>}
              </div>
            );
          }
        }}
        onClickDay={(date) => {
          const formatted = formatDate(date);
          setSelectedDate(formatted);
        }}
      />

      {selectedDate && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="day-training">
              <h3>{selectedDate}</h3>
              {dayRecords.map(r => (
                <div key={r.id} className="day-item">
                  <div className="exercise">{r.exercise}</div>
                  {r.sets.map((set, i) => (
                    <div key={i} className="sets">
                      {set.weight} kg × {set.reps}
                    </div>
                  ))}
                </div>
              ))}
              {dayRuns.map(r => (
                <div key={r.id} className="day-item" style={{ borderLeftColor: 'var(--run)' }}>
                  <div className="exercise" style={{ background: 'var(--run)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ラン
                  </div>
                  <div className="sets">{r.distance} km　{formatTime(r.timeSeconds ?? (r.time ?? 0) * 60)}　{formatPace(r.timeSeconds ?? (r.time ?? 0) * 60, r.distance)}</div>
                </div>
              ))}
              {dayRecords.length === 0 && dayRuns.length === 0 && (
                <p className="modal-empty">記録なし</p>
              )}
            </div>
            <button onClick={() => setSelectedDate(null)}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
