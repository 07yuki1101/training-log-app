import { useState, useEffect } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { collection, getDocs, query,orderBy } from "firebase/firestore";
import { db } from "./firebase";
import CalendarPage from "./pages/CalendarPage";
import SettingPage from "./pages/SettingPage";
import Tabs from "./components/Tabs";
import TrainingPage from "./pages/TrainingPage"
import MealPage from "./pages/MealPage"
import WeightPage from "./pages/WeightPage";
import Login from "./components/Login"
function App() {
  const [page, setPage] = useState(null);
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([])
  const [exercises, setExercises] = useState([])

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
  const fetchExercises = async (uid) => {
    const snap = await getDocs(
      collection(db, 'users', uid, 'exercises'));

    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setExercises(data);
  };



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchRecords(currentUser.uid)
        fetchExercises(currentUser.uid);
      }
    });
    return () => unsubscribe()
  }, []);


  if (!user) {
    return <Login></Login>
  }

  const handleLogout = async () => {
    try {
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
          <button onClick={handleLogout}>
            <span className="material-symbols-outlined small-btn">
              logout
            </span>
          </button>
          <button onClick={() => setPage('setting')}><span className="material-symbols-outlined small-btn">
            settings
          </span></button>
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
          fetchRecords={fetchRecords}/>}

      {page === 'meal' &&
        <MealPage
          user={user} />}

      {page === 'weight' &&
        <WeightPage
          user={user} />}

      {page === 'setting' &&
        <SettingPage
          user={user}
          exercises={exercises}
          setExercises={setExercises} />}
      {!page &&
        <CalendarPage 
        records={records}/>
      }


    </div>
  )
}

export default App
