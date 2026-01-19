function Tabs({ page, setPage }) {
  return (
    <div>
      {!page && (
        <div className="home">
          <label >
          <button onClick={() => setPage('training')}><span class="material-symbols-outlined">
            exercise
          </span></button>
          <p>Training</p>
          </label>
          <label>
          <button onClick={() => setPage('meal')}><span class="material-symbols-outlined">
            dining
          </span></button>
          <p>Meals</p>
          </label>
          <label>
          <button onClick={() => setPage('weight')}><span class="material-symbols-outlined">
            scale
          </span></button>
          <p>Weight</p>
          </label>
        </div>
      )}
      {page && (
        <div className="page">
          <button onClick={() => setPage('training')}><span class="material-symbols-outlined">
            exercise
          </span></button>
          <button onClick={() => setPage('meal')}><span class="material-symbols-outlined">
            dining
          </span></button>
          <button onClick={() => setPage('weight')}><span class="material-symbols-outlined">
            scale
          </span></button>
        </div>
      )}

    </div>
  );
}

export default Tabs;