const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');
const { authMiddleware } = require('./middleware');
const { getPlayerData, buyUpgrade, travelToTile, prestige, getMap } = require('./game');
const { UPGRADES } = require('./upgrades');

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username.length < 3 || username.length > 32) return res.status(400).json({ error: 'Username must be 3-32 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username.toLowerCase(), hash]
    );
    const user = rows[0];
    await pool.query('INSERT INTO player_state (user_id) VALUES ($1)', [user.id]);

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Game ──────────────────────────────────────────────────────────────────────

router.get('/game/state', authMiddleware, async (req, res) => {
  try {
    const data = await getPlayerData(req.userId);
    if (!data) return res.status(404).json({ error: 'Player not found' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/game/upgrade/:upgradeId', authMiddleware, async (req, res) => {
  try {
    const data = await buyUpgrade(req.userId, req.params.upgradeId);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/game/prestige', authMiddleware, async (req, res) => {
  try {
    const data = await prestige(req.userId);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/game/upgrades', authMiddleware, (req, res) => {
  res.json(UPGRADES);
});

// ─── Map ───────────────────────────────────────────────────────────────────────

router.get('/map', authMiddleware, async (req, res) => {
  try {
    const tiles = await getMap(req.userId);
    res.json(tiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/map/travel', authMiddleware, async (req, res) => {
  const { q, r } = req.body;
  if (q === undefined || r === undefined) return res.status(400).json({ error: 'q and r required' });
  try {
    const data = await travelToTile(req.userId, parseInt(q), parseInt(r));
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Leaderboard ───────────────────────────────────────────────────────────────

router.get('/leaderboard', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.username, ps.gold, ps.prestige_level,
             (ps.gold_per_sec * ps.prestige_multiplier) as gps
      FROM users u
      JOIN player_state ps ON u.id = ps.user_id
      ORDER BY ps.prestige_level DESC, ps.gold DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
