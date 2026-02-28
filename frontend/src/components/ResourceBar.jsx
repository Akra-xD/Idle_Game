export function ResourceBar({ state }) {
  if (!state) return null;

  const fmt = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
  };

  const fmtRate = (n) => {
    if (n === 0) return '0';
    return n.toFixed(1);
  };

  const resources = [
    { label: 'Gold', icon: '🪙', value: state.gold, rate: state.goldPerSec, color: '#f5c518' },
    { label: 'Wood', icon: '🪵', value: state.wood, rate: state.woodPerSec, color: '#8B6914' },
    { label: 'Stone', icon: '🪨', value: state.stone, rate: state.stonePerSec, color: '#9E9E9E' },
  ];

  return (
    <div className="resource-bar">
      {resources.map(r => (
        <div className="resource-card" key={r.label} style={{ '--accent': r.color }}>
          <span className="resource-icon">{r.icon}</span>
          <div className="resource-info">
            <span className="resource-value">{fmt(r.value)}</span>
            <span className="resource-rate">+{fmtRate(r.rate)}/s</span>
          </div>
          <span className="resource-label">{r.label}</span>
        </div>
      ))}
      {state.prestigeLevel > 0 && (
        <div className="resource-card prestige-card">
          <span className="resource-icon">✨</span>
          <div className="resource-info">
            <span className="resource-value">×{state.prestigeMultiplier.toFixed(1)}</span>
            <span className="resource-rate">Prestige {state.prestigeLevel}</span>
          </div>
          <span className="resource-label">Bonus</span>
        </div>
      )}
    </div>
  );
}
