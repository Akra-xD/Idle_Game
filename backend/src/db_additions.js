// ADD THIS to your existing initDB() function in backend/src/db.js
// Insert after the existing CREATE TABLE statements:

/*
  CREATE TABLE IF NOT EXISTS map_tiles (
    id SERIAL PRIMARY KEY,
    q INTEGER NOT NULL,
    r INTEGER NOT NULL,
    type VARCHAR(32) NOT NULL,
    UNIQUE(q, r)
  );

  -- Add location tracking to player_state
  ALTER TABLE player_state
    ADD COLUMN IF NOT EXISTS tile_q INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS tile_r INTEGER DEFAULT 3;
*/

// AND add this function call inside initDB(), after the CREATE TABLE block:
// await seedMap(client);

// ADD this new function to db.js:
/*
async function seedMap(client) {
  const { generateTiles } = require('./mapgen');
  const count = await client.query('SELECT COUNT(*) FROM map_tiles');
  if (parseInt(count.rows[0].count) > 0) return; // already seeded

  const tiles = generateTiles();
  for (const tile of tiles) {
    await client.query(
      'INSERT INTO map_tiles (q, r, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [tile.q, tile.r, tile.type]
    );
  }
  console.log('🗺️  Map seeded with', tiles.length, 'tiles');
}
*/
