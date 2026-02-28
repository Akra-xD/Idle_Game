import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useGame } from '../hooks/useGame';
import { ResourceBar } from '../components/ResourceBar';
import { UpgradesPanel } from '../components/UpgradesPanel';
import { Leaderboard } from '../components/Leaderboard';
import WorldMap from './WorldMap';

const TILE_LABELS = {
  plains: 'Plains', forest: 'Forest', mountain: 'Mountain',
  goldvein: 'Gold Vein', lake: 'Lake', swamp: 'Swamp',
  ruins: 'Ancient Ruins', village: 'Village',
};

export default function GamePage() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const { state, upgrades, loading, error, buyUpgrade, doPrestige, updateState } = useGame();
  const [activeTab, setActiveTab] = useState('upgrades');
  const [prestigeConfirm, setPrestigeConfirm] = useState(false);
  const [prestigeMsg, setPrestigeMsg] = useState('');

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handlePrestige() {
    if (!prestigeConfirm) {
      setPrestigeConfirm(true);
      setTimeout(() => setPrestigeConfirm(false), 4000);
      return;
    }
    const result = await doPrestige();
    setPrestigeConfirm(false);
    setPrestigeMsg(result.success ? '✨ Prestige complete!' : result.error);
    setTimeout(() => setPrestigeMsg(''), 3000);
  }

  const canPrestige = state && parseFloat(state.gold) >= 10000;

  if (error) return (
    <div className="game-error">
      <p>Failed to load game: {error}</p>
      <button onClick={handleLogout} className="btn-primary">Back to Login</button>
    </div>
  );

  return (
    <div className="game-layout">
      <header className="game-header">
        <div className="header-left">
          <span className="game-logo">⚔️ Idle Realm</span>
        </div>
        <div className="header-center">
          {state && <ResourceBar state={state} />}
        </div>
        <div className="header-right">
          <span className="header-username">👤 {username}</span>
          {canPrestige && (
            <button
              className={`btn-prestige ${prestigeConfirm ? 'confirm' : ''}`}
              onClick={handlePrestige}
              title="Reset for a permanent multiplier bonus"
            >
              {prestigeConfirm ? 'Are you sure?' : '✨ Prestige'}
            </button>
          )}
          {prestigeMsg && <span className="prestige-msg">{prestigeMsg}</span>}
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="game-body">
        <div className="tab-bar">
          <button className={`tab ${activeTab === 'upgrades' ? 'active' : ''}`} onClick={() => setActiveTab('upgrades')}>
            🏗️ Upgrades
          </button>
          <button className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            🗺️ World Map
          </button>
          <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            🏆 Leaderboard
          </button>
        </div>

        <div className="tab-content">
          {loading ? (
            <div className="loading-screen">
              <div className="loading-spinner" />
              <p>Loading your kingdom...</p>
            </div>
          ) : activeTab === 'upgrades' ? (
            <UpgradesPanel upgrades={upgrades} state={state} onBuy={buyUpgrade} />
          ) : activeTab === 'map' ? (
            <WorldMap playerState={state} onStateUpdate={updateState} />
          ) : (
            <Leaderboard currentUsername={username} />
          )}
        </div>

        {state && (
          <div className="stats-footer">
            <span>Total rate: 🪙 {state.goldPerSec.toFixed(1)}/s · 🪵 {state.woodPerSec.toFixed(1)}/s · 🪨 {state.stonePerSec.toFixed(1)}/s</span>
            {state.prestigeLevel > 0 && <span> · ✨ Prestige ×{state.prestigeMultiplier.toFixed(1)}</span>}
            {state.tileType && <span> · 📍 {TILE_LABELS[state.tileType] || state.tileType}</span>}
          </div>
        )}
      </div>
    </div>
  );
}


