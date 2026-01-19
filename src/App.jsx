import { useState, useEffect } from "react"
import Tabs from "./components/Tabs";
import TrainingPage from "./pages/TrainingPage"
import MealPage from "./pages/MealPage"
import WeightPage from "./pages/WeightPage";
function App() {
  const [page, setPage]= useState(null);
  
  
  

  return (
    <div>
      <header>
        <h1>Training Log</h1>
      </header>
      <Tabs page={page} setPage={setPage} />
      {page === 'training' && <TrainingPage />}
      {page === 'meal' && <MealPage />}
      {page === 'weight' && <WeightPage />}
      
    </div>
  )
}

export default App
