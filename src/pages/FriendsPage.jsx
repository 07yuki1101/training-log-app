import { useState, useEffect } from "react";
import {
  collection, getDocs, doc, setDoc, deleteDoc, getDoc,
  query, orderBy, limit, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

function FriendsPage({ user }) {
  const [tab, setTab] = useState('feed');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [feed, setFeed] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (key) => {
    setOpenItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (tab === 'feed') fetchFeed();
  }, [tab, friends]);

  const fetchFriends = async () => {
    const snap = await getDocs(collection(db, 'friends', user.uid, 'list'));
    setFriends(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  };

  const fetchRequests = async () => {
    const snap = await getDocs(collection(db, 'friendRequests', user.uid, 'incoming'));
    setRequests(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  };

  const fetchFeed = async () => {
    if (friends.length === 0) { setFeed([]); return; }
    setFeedLoading(true);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const results = await Promise.all(
      friends.map(async (friend) => {
        try {
          const q = query(
            collection(db, 'users', friend.uid, 'records'),
            orderBy('date', 'desc'),
            limit(20)
          );
          const snap = await getDocs(q);
          const records = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(r => r.date >= dateStr);
          return { ...friend, records };
        } catch {
          return { ...friend, records: [] };
        }
      })
    );
    setFeed(results.filter(f => f.records.length > 0));
    setFeedLoading(false);
  };

  const sendRequest = async () => {
    const input = emailInput.trim();
    if (!input) return;
    setLoading(true);
    setMsg('');
    try {
      let targetUid, targetData;
      if (input.includes('@')) {
        const q = query(collection(db, 'userProfiles'), where('email', '==', input.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) { setMsg('ユーザーが見つかりません'); setLoading(false); return; }
        targetUid = snap.docs[0].id;
        targetData = snap.docs[0].data();
      } else {
        const snap = await getDoc(doc(db, 'userProfiles', input));
        if (!snap.exists()) { setMsg('ユーザーが見つかりません'); setLoading(false); return; }
        targetUid = snap.id;
        targetData = snap.data();
      }
      if (targetUid === user.uid) { setMsg('自分自身は追加できません'); setLoading(false); return; }
      if (friends.some(f => f.uid === targetUid)) { setMsg('すでに友達です'); setLoading(false); return; }

      await setDoc(doc(db, 'friendRequests', targetUid, 'incoming', user.uid), {
        email: user.email,
        displayName: user.displayName || user.email,
        sentAt: serverTimestamp()
      });
      setMsg(`${targetData.displayName || targetData.email} にリクエストを送りました`);
      setEmailInput('');
    } catch {
      setMsg('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (req) => {
    try {
      await setDoc(doc(db, 'friends', user.uid, 'list', req.uid), {
        email: req.email,
        displayName: req.displayName,
        since: serverTimestamp()
      });
      await setDoc(doc(db, 'friends', req.uid, 'list', user.uid), {
        email: user.email,
        displayName: user.displayName || user.email,
        since: serverTimestamp()
      });
      await deleteDoc(doc(db, 'friendRequests', user.uid, 'incoming', req.uid));
      setRequests(prev => prev.filter(r => r.uid !== req.uid));
      fetchFriends();
    } catch (e) { console.error(e); }
  };

  const declineRequest = async (uid) => {
    await deleteDoc(doc(db, 'friendRequests', user.uid, 'incoming', uid));
    setRequests(prev => prev.filter(r => r.uid !== uid));
  };

  const removeFriend = async (friendUid) => {
    if (!window.confirm('友達を削除しますか？')) return;
    await deleteDoc(doc(db, 'friends', user.uid, 'list', friendUid));
    await deleteDoc(doc(db, 'friends', friendUid, 'list', user.uid));
    setFriends(prev => prev.filter(f => f.uid !== friendUid));
  };

  const groupByDate = (records) =>
    records.reduce((acc, r) => {
      if (!acc[r.date]) acc[r.date] = [];
      acc[r.date].push(r);
      return acc;
    }, {});

  return (
    <div>
      <div className="friends-tabs">
        <button
          className={`friends-tab-btn${tab === 'feed' ? ' active' : ''}`}
          onClick={() => setTab('feed')}
        >みんなの記録</button>
        <button
          className={`friends-tab-btn${tab === 'friends' ? ' active' : ''}`}
          onClick={() => setTab('friends')}
        >
          友達一覧
          {requests.length > 0 && <span className="req-badge">{requests.length}</span>}
        </button>
      </div>

      {tab === 'feed' && (
        <div className="log">
          {feedLoading && <p className="friends-empty">読み込み中...</p>}
          {!feedLoading && friends.length === 0 && (
            <p className="friends-empty">友達を追加するとここにトレーニングが表示されます</p>
          )}
          {!feedLoading && friends.length > 0 && feed.length === 0 && (
            <p className="friends-empty">直近7日間の記録はありません</p>
          )}
          {feed.map(friend => (
            <div key={friend.uid} className="friend-feed-section">
              <div className="friend-feed-header">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--friends)' }}>person</span>
                <span className="friend-feed-name">{friend.displayName}</span>
              </div>
              {Object.entries(groupByDate(friend.records))
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, recs]) => {
                  const key = `${friend.uid}_${date}`;
                  const isOpen = openItems.includes(key);
                  return (
                    <div key={date}>
                      <div className="date">
                        <h3>{date}</h3>
                        <div className="table-action">
                          <button onClick={() => toggleItem(key)}>
                            {isOpen
                              ? <span className="material-symbols-outlined arrow small-btn">keyboard_arrow_up</span>
                              : <span className="material-symbols-outlined arrow small-btn">keyboard_arrow_down</span>}
                          </button>
                        </div>
                      </div>
                      {isOpen && (
                        <div>
                          {recs.map(r => (
                            <div key={r.id} className="item-card">
                              <div className="item-name">
                                <div className="train-name">{r.exercise}</div>
                              </div>
                              <div className="item-sets">
                                {r.sets?.map((s, i) => (
                                  <div key={i}>{s.weight}kg × {s.reps}回</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {tab === 'friends' && (
        <div className="log">
          <p className="section-title">友達を追加</p>
          <div className="friend-add-form">
            <input
              type="email"
              placeholder="メールアドレスまたはユーザーIDで検索"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendRequest()}
            />
            <button onClick={sendRequest} disabled={loading || !emailInput.trim()}>
              <span className="material-symbols-outlined">person_add</span>
            </button>
          </div>
          {msg && <p className="friends-msg">{msg}</p>}

          {requests.length > 0 && (
            <>
              <p className="section-title" style={{ marginTop: 20 }}>
                リクエスト ({requests.length})
              </p>
              {requests.map(req => (
                <div key={req.uid} className="friend-request-card">
                  <div className="friend-info">
                    <span className="friend-name">{req.displayName}</span>
                    <span className="friend-email">{req.email}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="req-accept-btn" onClick={() => acceptRequest(req)}>承認</button>
                    <button className="req-decline-btn" onClick={() => declineRequest(req.uid)}>拒否</button>
                  </div>
                </div>
              ))}
            </>
          )}

          <p className="section-title" style={{ marginTop: 20 }}>
            友達 ({friends.length})
          </p>
          {friends.length === 0 ? (
            <p className="friends-empty">まだ友達がいません</p>
          ) : (
            friends.map(friend => (
              <div key={friend.uid} className="friend-card">
                <div className="friend-info">
                  <span className="friend-name">{friend.displayName}</span>
                  <span className="friend-email">{friend.email}</span>
                </div>
                <button className="friend-remove-btn" onClick={() => removeFriend(friend.uid)}>
                  <span className="material-symbols-outlined">person_remove</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default FriendsPage;
