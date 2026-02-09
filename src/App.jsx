import { useState, useEffect } from "react"
import { onAuthStateChanged, signOut} from "firebase/auth";
import { auth } from "./firebase";

import Tabs from "./components/Tabs";
import TrainingPage from "./pages/TrainingPage"
import MealPage from "./pages/MealPage"
import WeightPage from "./pages/WeightPage";
import Login from "./components/Login"
function App() {
  const [page, setPage] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe
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
        <div><button onClick={handleLogout}><span className="material-symbols-outlined">
logout
</span></button></div>
        
      </header>
      <Tabs page={page} setPage={setPage} />
      {page === 'training' && <TrainingPage user={user}/>}
      {page === 'meal' && <MealPage user={user} />}
      {page === 'weight' && <WeightPage user={user} />}

    </div>
  )
}

export default App
