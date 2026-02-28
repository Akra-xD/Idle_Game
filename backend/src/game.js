const { pool } = require('./db');

// Calculate offline gains and return updated state
async function tickPlayer(userId) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT * FROM player_state WHERE user_id = $1',
      [userId]
    );
    if (rows.length === 0) return null;

    const state = rows[0];
    const now = new Date();
    const lastTick = new Date(state.last_tick_at);
    const secondsElapsed = Math.min((now - lastTick) / 1000, 86400); // cap at 24h offline gains

    const multiplier = parseFloat(state.prestige_multiplier);
    const goldGained = secondsElapsed * parseFloat(state.gold_per_sec) * multiplier;
    const woodGained = secondsElapsed * parseFloat(state.wood_per_sec) * multiplier;
    const stoneGained = secondsElapsed * parseFloat(state.stone_per_sec) * multiplier;

    const { rows: updated } = await client.query(
      `UPDATE player_state
       SET gold = gold + $1,
           wood = wood + $2,
           stone = stone + $3,
           last_tick_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [goldGained, woodGained, stoneGained, userId]
    );

    return updated[0];
  } finally {
    client.release();
  }
}

// Get player state with upgrades
async function getPlayerData(userId) {
  const state = await tickPlayer(userId);
  if (!state) return null;

  const { rows: upgrades } = await pool.query(
    'SELECT upgrade_id, quantity FROM player_upgrades WHERE user_id = $1',
    [userId]
  );

  return {
    gold: parseFloat(state.gold).toFixed(0),
    wood: parseFloat(state.wood).toFixed(0),
    stone: parseFloat(state.stone).toFixed(0),
    goldPerSec: parseFloat(state.gold_per_sec) * parseFloat(state.prestige_multiplier),
    woodPerSec: parseFloat(state.wood_per_sec) * parseFloat(state.prestige_multiplier),
    stonePerSec: parseFloat(state.stone_per_sec) * parseFloat(state.prestige_multiplier),
    prestigeLevel: state.prestige_level,
    prestigeMultiplier: parseFloat(state.prestige_multiplier),
    upgrades: upgrades.reduce((acc, u) => {
      acc[u.upgrade_id] = u.quantity;
      return acc;
    }, {}),
  };
}

// Buy an upgrade
async function buyUpgrade(userId, upgradeId) {
  const { UPGRADES } = require('./upgrades');
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) throw new Error('Invalid upgrade');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current state + tick first
    await tickPlayer(userId);
    const { rows } = await client.query(
      'SELECT * FROM player_state WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    const state = rows[0];

    // Check existing quantity
    const { rows: existing } = await client.query(
      'SELECT quantity FROM player_upgrades WHERE user_id = $1 AND upgrade_id = $2',
      [userId, upgradeId]
    );
    const currentQty = existing.length > 0 ? existing[0].quantity : 0;
    if (upgrade.maxQuantity && currentQty >= upgrade.maxQuantity) {
      throw new Error('Max quantity reached');
    }

    // Check if prerequisite is met
    if (upgrade.requires) {
      const { rows: req } = await client.query(
        'SELECT quantity FROM player_upgrades WHERE user_id = $1 AND upgrade_id = $2',
        [userId, upgrade.requires]
      );
      if (req.length === 0) throw new Error('Prerequisite not met');
    }

    // Check resource costs
    const cost = upgrade.cost;
    if (cost.gold && parseFloat(state.gold) < cost.gold) throw new Error('Not enough gold');
    if (cost.wood && parseFloat(state.wood) < cost.wood) throw new Error('Not enough wood');
    if (cost.stone && parseFloat(state.stone) < cost.stone) throw new Error('Not enough stone');

    // Deduct costs
    await client.query(
      `UPDATE player_state SET
        gold = gold - $1,
        wood = wood - $2,
        stone = stone - $3,
        gold_per_sec = gold_per_sec + $4,
        wood_per_sec = wood_per_sec + $5,
        stone_per_sec = stone_per_sec + $6,
        updated_at = NOW()
       WHERE user_id = $7`,
      [
        cost.gold || 0,
        cost.wood || 0,
        cost.stone || 0,
        upgrade.effect.gold_per_sec || 0,
        upgrade.effect.wood_per_sec || 0,
        upgrade.effect.stone_per_sec || 0,
        userId,
      ]
    );

    // Record upgrade
    await client.query(
      `INSERT INTO player_upgrades (user_id, upgrade_id, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, upgrade_id)
       DO UPDATE SET quantity = player_upgrades.quantity + 1`,
      [userId, upgradeId]
    );

    await client.query('COMMIT');
    return await getPlayerData(userId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Prestige - reset resources for a permanent multiplier bonus
async function prestige(userId) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT * FROM player_state WHERE user_id = $1',
      [userId]
    );
    const state = rows[0];
    if (parseFloat(state.gold) < 10000) throw new Error('Need 10,000 gold to prestige');

    const newLevel = state.prestige_level + 1;
    const newMultiplier = 1 + newLevel * 0.5; // +50% per prestige

    await client.query(
      `UPDATE player_state SET
        gold = 0, wood = 0, stone = 0,
        gold_per_sec = 0.5, wood_per_sec = 0.2, stone_per_sec = 0.1,
        prestige_level = $1, prestige_multiplier = $2,
        last_tick_at = NOW(), updated_at = NOW()
       WHERE user_id = $3`,
      [newLevel, newMultiplier, userId]
    );
    await client.query('DELETE FROM player_upgrades WHERE user_id = $1', [userId]);

    return await getPlayerData(userId);
  } finally {
    client.release();
  }
}

module.exports = { getPlayerData, buyUpgrade, prestige };
