import { useState, useEffect } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth } from "./firebase";
import { collection, getDocs, query, orderBy, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import CalendarPage from "./pages/CalendarPage";
import SettingPage from "./pages/SettingPage";
import Tabs from "./components/Tabs";
import TrainingPage from "./pages/TrainingPage"
import RunPage from "./pages/RunPage"
import MealPage from "./pages/MealPage"
import WeightPage from "./pages/WeightPage";
import FriendsPage from "./pages/FriendsPage";
import Login from "./components/Login"
import SetupName from "./components/SetupName"
function App() {
  const [page, setPage] = useState(null);
  const [user, setUser] = useState(null);
  const [needsName, setNeedsName] = useState(false);
  const [records, setRecords] = useState([])
  const [exercises, setExercises] = useState([])
  const [runRecords, setRunRecords] = useState([])

   const fetchRecords = async (uid) => {
      const q = query(
        collection(db, 'users', uid, 'records'),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
  
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setRecords(data);
    }
  const fetchRunRecords = async (uid) => {
    const snap = await getDocs(query(collection(db, 'users', uid, 'runs'), orderBy('createdAt', 'asc')));
    setRunRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchExercises = async (uid) => {
    const snap = await getDocs(collection(db, 'users', uid, 'exercises'));
    const existing = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await seedDefaultExercises(uid, existing);
    const snap2 = await getDocs(collection(db, 'users', uid, 'exercises'));
    setExercises(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const seedDefaultExercises = async (uid, existing) => {
    const existingNames = new Set(existing.map(e => e.name));
    const defaults = [
      { name: 'ベンチプレス',           bodyPart: '胸' },
      { name: 'インクラインベンチプレス', bodyPart: '胸' },
      { name: 'ダンベルフライ',          bodyPart: '胸' },
      { name: 'ディップス',             bodyPart: '胸' },
      { name: 'チェストプレス',          bodyPart: '胸' },
      { name: 'デッドリフト',            bodyPart: '背中' },
      { name: '懸垂',                   bodyPart: '背中' },
      { name: 'ラットプルダウン',        bodyPart: '背中' },
      { name: 'ベントオーバーロウ',      bodyPart: '背中' },
      { name: 'シーテッドロウ',          bodyPart: '背中' },
      { name: 'ショルダープレス',        bodyPart: '肩' },
      { name: 'サイドレイズ',            bodyPart: '肩' },
      { name: 'フロントレイズ',          bodyPart: '肩' },
      { name: 'フェイスプル',            bodyPart: '肩' },
      { name: 'アーノルドプレス',        bodyPart: '肩' },
      { name: 'バーベルカール',          bodyPart: '腕' },
      { name: 'ダンベルカール',          bodyPart: '腕' },
      { name: 'ハンマーカール',          bodyPart: '腕' },
      { name: 'トライセプスプッシュダウン', bodyPart: '腕' },
      { name: 'スカルクラッシャー',      bodyPart: '腕' },
      { name: 'スクワット',              bodyPart: '脚' },
      { name: 'レッグプレス',            bodyPart: '脚' },
      { name: 'ルーマニアンデッドリフト', bodyPart: '脚' },
      { name: 'レッグカール',            bodyPart: '脚' },
      { name: 'カーフレイズ',            bodyPart: '脚' },
      { name: 'クランチ',               bodyPart: '腹筋' },
      { name: 'レッグレイズ',            bodyPart: '腹筋' },
      { name: 'プランク',               bodyPart: '腹筋' },
      { name: 'ロシアンツイスト',        bodyPart: '腹筋' },
      { name: 'アブドミナルクランチ',    bodyPart: '腹筋' },
    ];
    const toAdd = defaults.filter(ex => !existingNames.has(ex.name));
    if (toAdd.length === 0) return;
    const batch = writeBatch(db);
    toAdd.forEach(ex => {
      const ref = doc(collection(db, 'users', uid, 'exercises'));
      batch.set(ref, ex);
    });
    await batch.commit();
  };



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNeedsName(!currentUser.displayName);
        setDoc(doc(db, 'userProfiles', currentUser.uid), {
          displayName: currentUser.displayName || '',
          email: currentUser.email,
          photoUrl: currentUser.photoURL || ''
        }, { merge: true });
        fetchRecords(currentUser.uid);
        fetchRunRecords(currentUser.uid);
        fetchExercises(currentUser.uid);
        // タニタOAuthコールバック後はWeightページへ自動遷移
        const params = new URLSearchParams(window.location.search);
        if (params.get('tanita')) {
          setPage('weight');
        }
      }
    });
    return () => unsubscribe();
  }, []);


  if (!user) {
    return <Login />
  }

  if (needsName) {
    return <SetupName user={user} onComplete={() => setNeedsName(false)} />
  }

  const handleLogout = async () => {
    try {
      await FirebaseAuthentication.signOut();
      await signOut(auth);
    } catch (error) {
      console.error('ログアウト失敗', error);
    }
  }



  return (
    <div>
      <header>
        <h1 onClick={() => setPage(null)}>Training Log</h1>
        <div className="head-btn">
          <button onClick={() => setPage(null)}>
            <span className="material-symbols-outlined small-btn">home</span>
          </button>
          <button onClick={() => setPage('setting')}>
            <span className="material-symbols-outlined small-btn">settings</span>
          </button>
          <button onClick={handleLogout}>
            <span className="material-symbols-outlined small-btn">logout</span>
          </button>
        </div>

      </header>
      {page !== 'setting' &&
        <Tabs page={page} setPage={setPage} />
      }

      {page === 'training' &&
        <TrainingPage
          user={user}
          exercises={exercises}
          records={records}
          setRecords={setRecords}
          fetchRecords={fetchRecords}
          setPage={setPage} />}

      {page === 'run' &&
        <RunPage
          user={user}
          runRecords={runRecords}
          fetchRunRecords={fetchRunRecords} />}

      {page === 'meal' &&
        <MealPage
          user={user} />}

      {page === 'weight' &&
        <WeightPage
          user={user} />}

      {page === 'friends' &&
        <FriendsPage
          user={user} />}

      {page === 'setting' &&
        <SettingPage
          user={user}
          exercises={exercises}
          setExercises={setExercises} />}
      {!page &&
        <CalendarPage
          records={records}
          runRecords={runRecords} />
      }


    </div>
  )
}

export default App
