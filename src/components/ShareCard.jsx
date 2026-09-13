import { forwardRef } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MAX_EXERCISES = 6;

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`;
}

function formatSet(set) {
  return set.weight === '自重' ? `自重 × ${set.reps}` : `${set.weight}kg × ${set.reps}`;
}

// シェア画像はDOMをそのままPNG化するため、Webフォント（Material Symbols）に
// 依存しないよう、ブランドアイコンはインラインSVGで描画する。
function DumbbellIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="8.5" width="3" height="7" rx="1.2" fill={color} />
      <rect x="19.5" y="8.5" width="3" height="7" rx="1.2" fill={color} />
      <rect x="4.5" y="10" width="2.4" height="4" rx="0.8" fill={color} />
      <rect x="17.1" y="10" width="2.4" height="4" rx="0.8" fill={color} />
      <rect x="6.5" y="11" width="11" height="2" rx="1" fill={color} />
    </svg>
  );
}

function BrandHeader() {
  return (
    <div className="share-card-header">
      <span className="share-card-logo">
        <DumbbellIcon size={15} color="#fff" />
      </span>
      <span className="share-card-app-name">Training Log</span>
    </div>
  );
}

function BrandFooter() {
  return (
    <div className="share-card-footer">
      <DumbbellIcon size={13} color="#e8622e" />
      Training Log で記録中 ・ App Storeで無料配信中
    </div>
  );
}

const TrainingShareCard = forwardRef(function TrainingShareCard({ date, items }, ref) {
  const displayed = items.slice(0, MAX_EXERCISES);
  const rest = items.length - displayed.length;

  return (
    <div ref={ref} className="share-card share-card--training">
      <BrandHeader />
      <div className="share-card-date">{formatDateLabel(date)}</div>
      <div className="share-card-subtitle">今日のトレーニング</div>

      <div className="share-card-exercise-list">
        {displayed.map((item, i) => (
          <div key={item.id ?? i} className="share-card-exercise">
            <div className="share-card-exercise-name">{item.exercise}</div>
            <div className="share-card-exercise-sets">
              {item.sets.map((set, si) => (
                <span key={si} className="share-card-chip">{formatSet(set)}</span>
              ))}
            </div>
          </div>
        ))}
        {rest > 0 && <div className="share-card-more">他 {rest} 種目</div>}
      </div>

      <div className="share-card-stats">
        <div className="share-card-stat">
          <span className="share-card-stat-value">{items.length}</span>
          <span className="share-card-stat-label">種目</span>
        </div>
        <div className="share-card-stat">
          <span className="share-card-stat-value">
            {items.reduce((sum, item) => sum + item.sets.length, 0)}
          </span>
          <span className="share-card-stat-label">セット</span>
        </div>
      </div>

      <BrandFooter />
    </div>
  );
});

const WeightShareCard = forwardRef(function WeightShareCard({ points, latest }, ref) {
  const prev = points.length >= 2 ? points[points.length - 2] : null;
  const delta = prev && latest ? +(latest.bw - prev.bw).toFixed(1) : null;

  return (
    <div ref={ref} className="share-card share-card--weight">
      <BrandHeader />
      <div className="share-card-subtitle">体重の記録</div>

      {latest && (
        <div className="share-card-weight-now">
          <span className="share-card-weight-value">{latest.bw}</span>
          <span className="share-card-weight-unit">kg</span>
          {delta !== null && delta !== 0 && (
            <span className={`share-card-delta ${delta < 0 ? 'is-down' : 'is-up'}`}>
              {delta < 0 ? '▼' : '▲'} {Math.abs(delta)}kg
            </span>
          )}
        </div>
      )}
      {latest?.date && <div className="share-card-date">{formatDateLabel(latest.date)}</div>}

      {points.length >= 2 ? (
        <div className="share-card-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <XAxis dataKey="date" hide />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Line
                dataKey="bw"
                stroke="#e8622e"
                strokeWidth={4}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="share-card-chart-placeholder">記録を続けてグラフを育てよう</div>
      )}

      <BrandFooter />
    </div>
  );
});

const ShareCard = forwardRef(function ShareCard({ variant, date, items, points, latest }, ref) {
  if (variant === 'weight') {
    return <WeightShareCard ref={ref} points={points || []} latest={latest} />;
  }
  return <TrainingShareCard ref={ref} date={date} items={items || []} />;
});

export default ShareCard;
