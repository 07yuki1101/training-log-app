import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const NEXT_URL = "https://training-api-kohl.vercel.app";

function WeightPage({ user }) {
  const [weight, setWeight] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newWeight, setNewWeight] = useState({ date: '', bw: '' });
  const [range, setRange] = useState(30);
  const [showAllLog, setShowAllLog] = useState(false);

  const [tanitaConnected, setTanitaConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');


  const fetchWeight = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'weights'));
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setWeight(data);
    } catch (error) {
      console.error('Firestore読み込みエラー', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchWeight();

    // OAuthコールバック後のURLパラメータを確認
    const params = new URLSearchParams(window.location.search);
    if (params.get('tanita') === 'connected') {
      setTanitaConnected(true);
      setSyncMsg('HealthPlanet の連携が完了しました');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('tanita') === 'error') {
      const reason = params.get('reason');
      setSyncMsg(`連携に失敗しました。${reason ? `(${decodeURIComponent(reason)})` : '再度お試しください。'}`);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Firestore にトークンが保存済みか確認
    const checkToken = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'tokens', 'tanita'));
        setTanitaConnected(snap.exists());
      } catch {
        setTanitaConnected(false);
      }
    };
    checkToken();
  }, [user]);

  const handleTanitaSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch(`${NEXT_URL}/api/tanita/sync?uid=${user.uid}`);
      const data = await res.json();
      if (data.synced !== undefined) {
        setSyncMsg(data.synced > 0 ? `${data.synced}件のデータを取得しました` : '新しいデータはありません');
        await fetchWeight();
      } else {
        setSyncMsg(`同期に失敗しました: ${data.error ?? '不明なエラー'}`);
      }
    } catch {
      setSyncMsg('同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight.bw) { alert('体重を入力してください'); return; }
    try {
      const res = await fetch(`${NEXT_URL}/api/weight`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, weight: Number(newWeight.bw), date: newWeight.date }),
      });
      await res.json();
      const resGet = await fetch(`${NEXT_URL}/api/weight?userId=${user.uid}`);
      const data = await resGet.json();
      setWeight(data);
      setShowForm(false);
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("この記録を消しますか？");
    if (!ok) return;
    try {
      await fetch(`${NEXT_URL}/api/weight`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, id }),
      });
      setWeight(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('削除エラー:', error);
    }
  };

  const getToday = () => new Date().toISOString().split('T')[0];

  const filteredWeight = weight
    .filter(item => {
      const diff = (new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24);
      return diff <= range;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      {/* 同期ボタン（連携済みのみ表示） */}
      {tanitaConnected && (
        <div className="tanita-section">
          <div className="tanita-card tanita-card--connected">
            <span className="material-symbols-outlined tanita-icon">monitor_weight</span>
            <span className="tanita-label">HealthPlanet</span>
            <button className="tanita-sync-btn" onClick={handleTanitaSync} disabled={syncing}>
              {syncing
                ? <span className="material-symbols-outlined tanita-spin">sync</span>
                : <span className="material-symbols-outlined">sync</span>}
              {syncing ? '同期中' : '同期'}
            </button>
          </div>
          {syncMsg && <p className="sync-msg">{syncMsg}</p>}
        </div>
      )}

      {/* 手動入力フォーム */}
      {!showForm && (
        <div className="form-switch">
          <button className="add-btn" onClick={() => {
            setShowForm(true);
            setNewWeight(prev => ({ ...prev, date: getToday() }));
          }}>体重を追加</button>
        </div>
      )}
      {showForm && (
        <div className="form">
          <input type="date"
            value={newWeight.date}
            onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })} />
          <input type="number"
            placeholder="体重 (kg)"
            value={newWeight.bw}
            onChange={(e) => setNewWeight({ ...newWeight, bw: e.target.value })} />
          <button className="add-btn" onClick={handleAddWeight}>追加</button>
          <button className="cancel-btn" onClick={() => { setShowForm(false); setNewWeight({ date: '', bw: '' }); }}>
            <span className="material-symbols-outlined cancel">close_small</span>
          </button>
        </div>
      )}

      {/* グラフ */}
      <div className="graph">
        <div className="graph-switch">
          <button className="range-btn" onClick={() => setRange(30)}>1ヶ月</button>
          <button className="range-btn" onClick={() => setRange(180)}>6ヶ月</button>
          <button className="range-btn" onClick={() => setRange(365)}>1年</button>
        </div>
        <div className="graph-style">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredWeight}>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
                }} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={{ background: "#17122e", border: "none", borderRadius: "8px", color: "white" }}
                formatter={(value, _name, props) => [
                  `${value} kg`,
                  props.payload.source === 'tanita' ? 'タニタ' : '手動'
                ]} />
              <Line
                dataKey="bw"
                stroke="#18ffff"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isTanita = payload.source === 'tanita';
                  return (
                    <circle
                      key={`dot-${cx}-${cy}`}
                      cx={cx} cy={cy} r={4}
                      fill={isTanita ? '#18ffff' : '#00e676'}
                      stroke={isTanita ? 'rgba(24,255,255,0.3)' : 'rgba(0,230,118,0.3)'}
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="graph-legend">
            <span className="legend-tanita"><span className="legend-dot" />タニタ</span>
            <span className="legend-manual"><span className="legend-dot" />手動</span>
          </div>
        </div>
      </div>

      {/* 記録一覧 */}
      <div className="weight-log">
        <h2 className="section-title">体重記録</h2>
        {(() => {
          const sorted = [...weight].sort((a, b) => b.date.localeCompare(a.date));
          const LIMIT = 10;
          const displayed = showAllLog ? sorted : sorted.slice(0, LIMIT);
          return (
            <>
              <table>
                <tbody>
                  {displayed.map(day => (
                    <tr key={day.id} className="date">
                      <td>{day.date}</td>
                      <td>
                        {day.bw} kg
                        {day.source === 'tanita'
                          ? <span className="source-badge source-badge--tanita">タニタ</span>
                          : <span className="source-badge source-badge--manual">手動</span>
                        }
                      </td>
                      <td>
                        <button onClick={() => handleDelete(day.id)}>
                          <span className="material-symbols-outlined delete small-btn">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length > LIMIT && (
                <button className="show-more-btn" onClick={() => setShowAllLog(v => !v)}>
                  {showAllLog ? '閉じる' : `過去の記録をもっと見る（${sorted.length - LIMIT}件）`}
                </button>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

export default WeightPage;
