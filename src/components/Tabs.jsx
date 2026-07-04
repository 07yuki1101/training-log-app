const TABS = [
  { id: null,       icon: 'home',          label: 'Home',     color: '#c4b5fd' },
  { id: 'training', icon: 'exercise',      label: 'Training', color: 'var(--training)' },
  { id: 'run',      icon: 'directions_run',label: 'Run',      color: 'var(--run)' },
  { id: 'meal',     icon: 'dining',        label: 'Meal',     color: 'var(--meal)' },
  { id: 'weight',   icon: 'scale',         label: 'Weight',   color: 'var(--weight)' },
  { id: 'friends',  icon: 'group',         label: 'Friends',  color: 'var(--friends)' },
];

function Tabs({ page, setPage }) {
  return (
    <nav className="tab-bar">
      {TABS.map(tab => {
        const active = page === tab.id;
        return (
          <button
            key={String(tab.id)}
            className={`tab-item${active ? ' tab-active' : ''}`}
            style={{ '--tab-color': tab.color }}
            onClick={() => setPage(tab.id)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default Tabs;
