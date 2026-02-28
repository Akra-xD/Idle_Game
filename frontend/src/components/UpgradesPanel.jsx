import { useState } from 'react';

const CATEGORY_LABELS = {
  gold: { label: 'Gold', icon: '🪙' },
  wood: { label: 'Wood', icon: '🪵' },
  stone: { label: 'Stone', icon: '🪨' },
};

function canAfford(upgrade, state) {
  const cost = upgrade.cost;
  if (cost.gold && state.gold < cost.gold) return false;
  if (cost.wood && state.wood < cost.wood) return false;
  if (cost.stone && state.stone < cost.stone) return false;
  return true;
}

function isUnlocked(upgrade, playerUpgrades) {
  if (!upgrade.requires) return true;
  return !!playerUpgrades[upgrade.requires];
}

function isMaxed(upgrade, playerUpgrades) {
  if (!upgrade.maxQuantity) return false;
  return (playerUpgrades[upgrade.id] || 0) >= upgrade.maxQuantity;
}

export function UpgradesPanel({ upgrades, state, onBuy }) {
  const [activeCategory, setActiveCategory] = useState('gold');
  const [feedback, setFeedback] = useState({});

  if (!state) return null;

  const categories = [...new Set(Object.values(upgrades).map(u => u.category))];

  const categoryUpgrades = Object.values(upgrades).filter(u => u.category === activeCategory);

  async function handleBuy(upgradeId) {
    const result = await onBuy(upgradeId);
    setFeedback(prev => ({ ...prev, [upgradeId]: result.error || '✓' }));
    setTimeout(() => setFeedback(prev => { const n = {...prev}; delete n[upgradeId]; return n; }), 1500);
  }

  function formatCost(cost) {
    return Object.entries(cost)
      .map(([r, v]) => `${v.toLocaleString()} ${r}`)
      .join(', ');
  }

  return (
    <div className="upgrades-panel">
      <h2 className="panel-title">Upgrades</h2>
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label || cat}
          </button>
        ))}
      </div>

      <div className="upgrade-list">
        {categoryUpgrades.map(upgrade => {
          const unlocked = isUnlocked(upgrade, state.upgrades);
          const maxed = isMaxed(upgrade, state.upgrades);
          const affordable = canAfford(upgrade, state);
          const qty = state.upgrades[upgrade.id] || 0;

          return (
            <div
              key={upgrade.id}
              className={`upgrade-card ${!unlocked ? 'locked' : ''} ${maxed ? 'maxed' : ''}`}
            >
              <div className="upgrade-header">
                <span className="upgrade-icon">{upgrade.icon}</span>
                <div className="upgrade-meta">
                  <span className="upgrade-name">
                    {upgrade.name}
                    {upgrade.maxQuantity > 1 && <span className="upgrade-qty"> ({qty}/{upgrade.maxQuantity})</span>}
                  </span>
                  <span className="upgrade-desc">{upgrade.description}</span>
                </div>
              </div>
              {!unlocked ? (
                <div className="upgrade-locked-msg">🔒 Requires {upgrade.requires?.replace(/_/g, ' ')}</div>
              ) : maxed ? (
                <div className="upgrade-maxed-msg">✅ Maxed</div>
              ) : (
                <div className="upgrade-footer">
                  <span className="upgrade-cost">Cost: {formatCost(upgrade.cost)}</span>
                  <button
                    className={`btn-upgrade ${affordable ? 'can-afford' : 'cannot-afford'}`}
                    onClick={() => handleBuy(upgrade.id)}
                    disabled={!affordable}
                  >
                    {feedback[upgrade.id] || 'Buy'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
