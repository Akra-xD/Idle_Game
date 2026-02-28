const { pool } = require('./db');
const { TILE_TYPES } = require('./mapgen');

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
    const secondsElapsed = Math.min((now - lastTick) / 1000, 86400);

    const multiplier = parseFloat(state.prestige_multiplier);

    // Get tile bonuses
    const tileType = await getCurrentTileType(userId, state);
    const tileBonuses = tileType ? (TILE_TYPES[tileType]?.bonuses || {}) : {};

    const effectiveGps = (parseFloat(state.gold_per_sec) + (tileBonuses.gold_per_sec || 0)) * multiplier;
    const effectiveWps = (parseFloat(state.wood_per_sec) + (tileBonuses.wood_per_sec || 0)) * multiplier;
    const effectiveSps = (parseFloat(state.stone_per_sec) + (tileBonuses.stone_per_sec || 0)) * multiplier;

    const goldGained = secondsElapsed * effectiveGps;
    const woodGained = secondsElapsed * effectiveWps;
    const stoneGained = secondsElapsed * effectiveSps;

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

    return { state: updated[0], tileType, tileBonuses };
  } finally {
    client.release();
  }
}

async function getCurrentTileType(userId, stateRow) {
  const state = stateRow || (await pool.query('SELECT tile_q, tile_r FROM player_state WHERE user_id = $1', [userId])).rows[0];
  if (!state) return null;
  const { rows } = await pool.query(
    'SELECT type FROM map_tiles WHERE q = $1 AND r = $2',
    [state.tile_q, state.tile_r]
  );
  return rows[0]?.type || null;
}

// Get player state with upgrades
async function getPlayerData(userId) {
  const result = await tickPlayer(userId);
  if (!result) return null;
  const { state, tileType, tileBonuses } = result;

  const { rows: upgrades } = await pool.query(
    'SELECT upgrade_id, quantity FROM player_upgrades WHERE user_id = $1',
    [userId]
  );

  const multiplier = parseFloat(state.prestige_multiplier);

  return {
    gold: parseFloat(state.gold).toFixed(0),
    wood: parseFloat(state.wood).toFixed(0),
    stone: parseFloat(state.stone).toFixed(0),
    goldPerSec: (parseFloat(state.gold_per_sec) + (tileBonuses?.gold_per_sec || 0)) * multiplier,
    woodPerSec: (parseFloat(state.wood_per_sec) + (tileBonuses?.wood_per_sec || 0)) * multiplier,
    stonePerSec: (parseFloat(state.stone_per_sec) + (tileBonuses?.stone_per_sec || 0)) * multiplier,
    baseGoldPerSec: parseFloat(state.gold_per_sec) * multiplier,
    baseWoodPerSec: parseFloat(state.wood_per_sec) * multiplier,
    baseStonePerSec: parseFloat(state.stone_per_sec) * multiplier,
    prestigeLevel: state.prestige_level,
    prestigeMultiplier: multiplier,
    tileQ: state.tile_q,
    tileR: state.tile_r,
    tileType,
    tileBonuses: tileBonuses || {},
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

    await tickPlayer(userId);
    const { rows } = await client.query(
      'SELECT * FROM player_state WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    const state = rows[0];

    const { rows: existing } = await client.query(
      'SELECT quantity FROM player_upgrades WHERE user_id = $1 AND upgrade_id = $2',
      [userId, upgradeId]
    );
    const currentQty = existing.length > 0 ? existing[0].quantity : 0;
    if (upgrade.maxQuantity && currentQty >= upgrade.maxQuantity) {
      throw new Error('Max quantity reached');
    }

    if (upgrade.requires) {
      const { rows: req } = await client.query(
        'SELECT quantity FROM player_upgrades WHERE user_id = $1 AND upgrade_id = $2',
        [userId, upgrade.requires]
      );
      if (req.length === 0) throw new Error('Prerequisite not met');
    }

    const cost = upgrade.cost;
    if (cost.gold && parseFloat(state.gold) < cost.gold) throw new Error('Not enough gold');
    if (cost.wood && parseFloat(state.wood) < cost.wood) throw new Error('Not enough wood');
    if (cost.stone && parseFloat(state.stone) < cost.stone) throw new Error('Not enough stone');

    await client.query(
      `UPDATE player_state SET
        gold = gold - $1, wood = wood - $2, stone = stone - $3,
        gold_per_sec = gold_per_sec + $4,
        wood_per_sec = wood_per_sec + $5,
        stone_per_sec = stone_per_sec + $6,
        updated_at = NOW()
       WHERE user_id = $7`,
      [
        cost.gold || 0, cost.wood || 0, cost.stone || 0,
        upgrade.effect.gold_per_sec || 0,
        upgrade.effect.wood_per_sec || 0,
        upgrade.effect.stone_per_sec || 0,
        userId,
      ]
    );

    await client.query(
      `INSERT INTO player_upgrades (user_id, upgrade_id, quantity) VALUES ($1, $2, 1)
       ON CONFLICT (user_id, upgrade_id) DO UPDATE SET quantity = player_upgrades.quantity + 1`,
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

// Travel to an adjacent tile
async function travelToTile(userId, targetQ, targetR) {
  const { getNeighbors, TILE_TYPES } = require('./mapgen');

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT tile_q, tile_r, last_move_at FROM player_state WHERE user_id = $1',
      [userId]
    );
    const state = rows[0];

    // Cooldown check (5 seconds between moves)
    const secsSinceMove = (Date.now() - new Date(state.last_move_at)) / 1000;
    if (secsSinceMove < 5) {
      throw new Error(`Wait ${Math.ceil(5 - secsSinceMove)}s before moving again`);
    }

    // Check adjacency
    const neighbors = getNeighbors(state.tile_q, state.tile_r);
    const isAdjacent = neighbors.some(n => n.q === targetQ && n.r === targetR);
    if (!isAdjacent) throw new Error('Can only move to adjacent tiles');

    // Check tile exists and is not impassable
    const { rows: tileRows } = await client.query(
      'SELECT * FROM map_tiles WHERE q = $1 AND r = $2',
      [targetQ, targetR]
    );
    if (tileRows.length === 0) throw new Error('Tile not found');
    const tile = tileRows[0];
    if (TILE_TYPES[tile.type]?.impassable) throw new Error('Cannot travel to that tile');

    await client.query(
      'UPDATE player_state SET tile_q = $1, tile_r = $2, last_move_at = NOW() WHERE user_id = $3',
      [targetQ, targetR, userId]
    );

    return await getPlayerData(userId);
  } finally {
    client.release();
  }
}

// Prestige
async function prestige(userId) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT * FROM player_state WHERE user_id = $1', [userId]);
    const state = rows[0];
    if (parseFloat(state.gold) < 10000) throw new Error('Need 10,000 gold to prestige');

    const newLevel = state.prestige_level + 1;
    const newMultiplier = 1 + newLevel * 0.5;

    await client.query(
      `UPDATE player_state SET
        gold = 0, wood = 0, stone = 0,
        gold_per_sec = 0.5, wood_per_sec = 0.2, stone_per_sec = 0.1,
        prestige_level = $1, prestige_multiplier = $2,
        tile_q = 3, tile_r = 3,
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

// Get full map with player positions
async function getMap(userId) {
  const { rows: tiles } = await pool.query('SELECT * FROM map_tiles ORDER BY r, q');
  const { rows: players } = await pool.query(`
    SELECT u.username, ps.tile_q, ps.tile_r
    FROM player_state ps
    JOIN users u ON u.id = ps.user_id
  `);

  // Build player position lookup
  const playerMap = {};
  for (const p of players) {
    const key = `${p.tile_q},${p.tile_r}`;
    if (!playerMap[key]) playerMap[key] = [];
    playerMap[key].push(p.username);
  }

  return tiles.map(t => ({
    ...t,
    players: playerMap[`${t.q},${t.r}`] || [],
  }));
}

module.exports = { getPlayerData, buyUpgrade, travelToTile, prestige, getMap };
