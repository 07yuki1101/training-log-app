import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth";
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



  return (
    <div>
      <header>
        <h1 onClick={() => setPage(null)}>Training Log</h1>
      </header>
      <Tabs page={page} setPage={setPage} />
      {page === 'training' && <TrainingPage user={user}/>}
      {page === 'meal' && <MealPage user={user} />}
      {page === 'weight' && <WeightPage user={user} />}

    </div>
  )
}

export default App
