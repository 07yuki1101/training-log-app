function Tabs({ page, setPage }) {
  return (
    <div>
      {!page && (
        <div className="home">
          <button onClick={() => setPage('training')}>トレーニング</button>
          <button onClick={() => setPage('meal')}>食事</button>
          <button onClick={() => setPage('weight')}>体重</button>
        </div>
      )}
      {page && (
        <div className="page">
          <button onClick={() => setPage('training')}>トレーニング</button>
          <button onClick={() => setPage('meal')}>食事</button>
          <button onClick={() => setPage('weight')}>体重</button>
        </div>
      )}

    </div>
  );
}

export default Tabs;