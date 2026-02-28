import { useState, useEffect } from 'react';
import { api } from '../api';

export function Leaderboard({ currentUsername }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard()
      .then(setLeaders)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
  };

  return (
    <div className="leaderboard-panel">
      <h2 className="panel-title">🏆 Leaderboard</h2>
      {loading ? (
        <div className="loading-text">Loading...</div>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Prestige</th>
              <th>Gold</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((row, i) => (
              <tr key={row.username} className={row.username === currentUsername ? 'self-row' : ''}>
                <td className="rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td className="lb-username">{row.username}</td>
                <td>{'✨'.repeat(Math.min(row.prestige_level, 5))}{row.prestige_level > 5 ? ` ×${row.prestige_level}` : ''}</td>
                <td>{fmt(row.gold)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
