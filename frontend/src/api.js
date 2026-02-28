const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getState: () => request('/game/state'),
  getUpgrades: () => request('/game/upgrades'),
  buyUpgrade: (id) => request(`/game/upgrade/${id}`, { method: 'POST' }),
  prestige: () => request('/game/prestige', { method: 'POST' }),
  leaderboard: () => request('/leaderboard'),
};
