const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS player_upgrades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        upgrade_id VARCHAR(64) NOT NULL,
        quantity INTEGER DEFAULT 1,
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, upgrade_id)
      );
    `);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
