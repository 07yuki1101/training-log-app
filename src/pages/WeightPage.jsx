import { collection, getDocs, addDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase"
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from "recharts";

const NEXT_URL = "https://training-api-kohl.vercel.app";

function WeightPage({ user }) {
  const [weight, setWeight] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newWeight, setNewWeight] = useState({ date: '', bw: '', bf: '' });
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
      // ─── まずブラウザから直接 HealthPlanet API を呼ぶ（サーバーIPブロック回避）───
      let clientSynced = null;
      try {
        const tokenSnap = await getDoc(doc(db, 'users', user.uid, 'tokens', 'tanita'));
        if (tokenSnap.exists()) {
          const { accessToken } = tokenSnap.data();
          const to = new Date();
          const from = new Date(to);
          from.setFullYear(from.getFullYear() - 1);
          const fmt = (d) =>
            `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}000000`;
          const apiUrl = `https://www.healthplanet.jp/status/innerscan.json?access_token=${encodeURIComponent(accessToken)}&date=1&from=${fmt(from)}&to=${fmt(to)}&tag=6021,6022`;
          const hpRes = await fetch(apiUrl);
          const hpText = await hpRes.text();
          console.log('[client] HP status:', hpRes.status, 'body:', hpText.slice(0, 200));
          if (!hpText.trimStart().startsWith('<')) {
            const json = JSON.parse(hpText);
            const items = json.data ?? [];
            const existingSnap = await getDocs(collection(db, 'users', user.uid, 'weights'));
            const existingDates = new Set(existingSnap.docs.map(d => d.data().date));

            const byDate = new Map();
            for (const item of items) {
              const raw = item.date;
              const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
              const value = parseFloat(item.keydata);
              if (isNaN(value)) continue;
              if (!byDate.has(date)) byDate.set(date, {});
              const entry = byDate.get(date);
              if (item.tag === '6021') entry.bw = value;
              else if (item.tag === '6022') entry.bf = value;
            }

            let count = 0;
            for (const [date, entry] of byDate) {
              if (!existingDates.has(date) && entry.bw !== undefined) {
                await addDoc(collection(db, 'users', user.uid, 'weights'), {
                  date,
                  bw: entry.bw,
                  ...(entry.bf !== undefined ? { bf: entry.bf } : {}),
                  source: 'tanita',
                  syncedAt: new Date(),
                });
                count++;
              }
            }
            clientSynced = count;
          }
        }
      } catch (clientErr) {
        console.log('[client] direct API failed (CORS or other):', clientErr.message);
      }

      if (clientSynced !== null) {
        setSyncMsg(clientSynced > 0 ? `${clientSynced}件のデータを取得しました` : '新しいデータはありません');
        if (clientSynced > 0) await fetchWeight();
        return;
      }

      // ─── フォールバック: Vercel サーバー経由 ───
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
      const entry = {
        date: newWeight.date,
        bw: Number(newWeight.bw),
        source: 'manual',
        syncedAt: new Date(),
      };
      if (newWeight.bf !== '') entry.bf = Number(newWeight.bf);
      await addDoc(collection(db, 'users', user.uid, 'weights'), entry);
      await fetchWeight();
      setShowForm(false);
      setNewWeight({ date: '', bw: '', bf: '' });
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
          <input type="number"
            placeholder="体脂肪率 (%) 任意"
            value={newWeight.bf}
            onChange={(e) => setNewWeight({ ...newWeight, bf: e.target.value })} />
          <button className="add-btn" onClick={handleAddWeight}>追加</button>
          <button className="cancel-btn" onClick={() => { setShowForm(false); setNewWeight({ date: '', bw: '', bf: '' }); }}>
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
              <YAxis
                yAxisId="bw"
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                yAxisId="bf"
                orientation="right"
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ background: "#17122e", border: "none", borderRadius: "8px", color: "white" }}
                formatter={(value, name) => {
                  if (name === 'bw') return [`${value} kg`, '体重'];
                  if (name === 'bf') return [`${value} %`, '体脂肪率'];
                  return [value, name];
                }} />
              <Line
                yAxisId="bw"
                dataKey="bw"
                stroke="#18ffff"
                strokeWidth={2}
                connectNulls
                dot={{ r: 4, fill: '#18ffff', stroke: 'rgba(24,255,255,0.3)', strokeWidth: 2 }}
              />
              <Line
                yAxisId="bf"
                dataKey="bf"
                stroke="#ff6b6b"
                strokeWidth={2}
                strokeDasharray="4 2"
                connectNulls
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.bf == null) return null;
                  return (
                    <circle
                      key={`bf-${cx}-${cy}`}
                      cx={cx} cy={cy} r={4}
                      fill="#ff6b6b"
                      stroke="rgba(255,107,107,0.3)"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="graph-legend">
            <span className="legend-tanita"><span className="legend-dot" />体重 (kg)</span>
            <span className="legend-bf"><span className="legend-dot legend-dot--bf" />体脂肪率 (%)</span>
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
                      <td>{day.bw} kg</td>
                      <td className="bf-cell">
                        {day.bf != null ? `${day.bf} %` : '—'}
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
