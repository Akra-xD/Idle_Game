const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedMap(client) {
  const { generateTiles } = require('./mapgen');
  const count = await client.query('SELECT COUNT(*) FROM map_tiles');
  if (parseInt(count.rows[0].count) > 0) return;

  const tiles = generateTiles();
  for (const tile of tiles) {
    await client.query(
      'INSERT INTO map_tiles (q, r, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [tile.q, tile.r, tile.type]
    );
  }
  console.log('🗺️  Map seeded with', tiles.length, 'tiles');
}

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(32) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS player_state (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        gold NUMERIC(20, 4) DEFAULT 0,
        wood NUMERIC(20, 4) DEFAULT 0,
        stone NUMERIC(20, 4) DEFAULT 0,
        gold_per_sec NUMERIC(10, 4) DEFAULT 0.5,
        wood_per_sec NUMERIC(10, 4) DEFAULT 0.2,
        stone_per_sec NUMERIC(10, 4) DEFAULT 0.1,
        prestige_level INTEGER DEFAULT 0,
        prestige_multiplier NUMERIC(6, 2) DEFAULT 1.0,
        last_tick_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        tile_q INTEGER DEFAULT 3,
        tile_r INTEGER DEFAULT 3,
        last_move_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS player_upgrades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        upgrade_id VARCHAR(64) NOT NULL,
        quantity INTEGER DEFAULT 1,
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, upgrade_id)
      );

      CREATE TABLE IF NOT EXISTS map_tiles (
        id SERIAL PRIMARY KEY,
        q INTEGER NOT NULL,
        r INTEGER NOT NULL,
        type VARCHAR(32) NOT NULL,
        UNIQUE(q, r)
      );
    `);

    // Add map columns to existing deployments that don't have them yet
    await client.query(`
      ALTER TABLE player_state ADD COLUMN IF NOT EXISTS tile_q INTEGER DEFAULT 3;
      ALTER TABLE player_state ADD COLUMN IF NOT EXISTS tile_r INTEGER DEFAULT 3;
      ALTER TABLE player_state ADD COLUMN IF NOT EXISTS last_move_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await seedMap(client);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
