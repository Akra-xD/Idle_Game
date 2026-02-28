import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

// ── Tile visual definitions ──────────────────────────────────────────────────

const TILE_VISUALS = {
  plains: {
    label: 'Plains',
    bg: 'linear-gradient(160deg, #4a7c3f 0%, #5a9e4a 40%, #3d6b34 100%)',
    accent: '#7dc464',
    icon: '🌾',
    description: 'Balanced resource production.',
    bonuses: { gold: 0.2, wood: 0.1, stone: 0.1 },
    elements: [
      { shape: 'ellipse', cx: 50, cy: 75, rx: 35, ry: 8, fill: 'rgba(80,140,60,0.4)' },
      { shape: 'rect', x: 30, y: 45, w: 4, h: 20, fill: '#c8a830', rx: 1 },
      { shape: 'rect', x: 44, y: 40, w: 4, h: 25, fill: '#c8a830', rx: 1 },
      { shape: 'rect', x: 58, y: 43, w: 4, h: 22, fill: '#c8a830', rx: 1 },
      { shape: 'ellipse', cx: 32, cy: 44, rx: 7, ry: 4, fill: '#e8c040' },
      { shape: 'ellipse', cx: 46, cy: 38, rx: 7, ry: 4, fill: '#e8c040' },
      { shape: 'ellipse', cx: 60, cy: 41, rx: 7, ry: 4, fill: '#e8c040' },
    ],
  },
  forest: {
    label: 'Forest',
    bg: 'linear-gradient(160deg, #1a3d1a 0%, #2d5c2d 50%, #1a3020 100%)',
    accent: '#4a9e4a',
    icon: '🌲',
    description: 'Excellent for timber.',
    bonuses: { gold: 0.1, wood: 0.8, stone: 0 },
    elements: [
      { shape: 'ellipse', cx: 50, cy: 80, rx: 40, ry: 7, fill: 'rgba(20,50,20,0.5)' },
      { shape: 'tree', cx: 28, cy: 55, size: 22, dark: true },
      { shape: 'tree', cx: 50, cy: 45, size: 28, dark: false },
      { shape: 'tree', cx: 72, cy: 55, size: 22, dark: true },
    ],
  },
  mountain: {
    label: 'Mountain',
    bg: 'linear-gradient(160deg, #2a2a2a 0%, #4a4a5a 50%, #3a3a4a 100%)',
    accent: '#8a8aaa',
    icon: '⛏️',
    description: 'Rich with stone and ore.',
    bonuses: { gold: 0.3, wood: 0, stone: 0.8 },
    elements: [
      { shape: 'mountain', cx: 50, cy: 30, w: 70, h: 50, fill: '#5a5a6a', snow: true },
      { shape: 'mountain', cx: 25, cy: 45, w: 40, h: 35, fill: '#4a4a5a', snow: false },
      { shape: 'mountain', cx: 75, cy: 45, w: 40, h: 35, fill: '#4a4a5a', snow: false },
    ],
  },
  goldvein: {
    label: 'Gold Vein',
    bg: 'linear-gradient(160deg, #2a1a00 0%, #4a3000 50%, #3a2500 100%)',
    accent: '#f5c518',
    icon: '✨',
    description: 'A glittering seam of gold.',
    bonuses: { gold: 1.2, wood: 0, stone: 0.1 },
    elements: [
      { shape: 'ellipse', cx: 50, cy: 75, rx: 35, ry: 8, fill: 'rgba(100,70,0,0.4)' },
      { shape: 'crystal', cx: 50, cy: 45, fill: '#f5c518' },
      { shape: 'crystal', cx: 30, cy: 58, fill: '#e8b010', small: true },
      { shape: 'crystal', cx: 70, cy: 55, fill: '#ffd740', small: true },
      { shape: 'sparkle', cx: 50, cy: 35 },
    ],
  },
  lake: {
    label: 'Lake',
    bg: 'linear-gradient(160deg, #0a2a4a 0%, #1a4a7a 50%, #0a3060 100%)',
    accent: '#4a9fd4',
    icon: '🚫',
    description: 'Impassable water.',
    bonuses: { gold: 0, wood: 0, stone: 0 },
    impassable: true,
    elements: [
      { shape: 'ellipse', cx: 50, cy: 55, rx: 38, ry: 22, fill: 'rgba(30,100,180,0.6)' },
      { shape: 'wave', cy: 48 },
      { shape: 'wave', cy: 56 },
      { shape: 'wave', cy: 64 },
    ],
  },
  swamp: {
    label: 'Swamp',
    bg: 'linear-gradient(160deg, #1a2a0a 0%, #2a3a10 50%, #182810 100%)',
    accent: '#6a8a2a',
    icon: '🌿',
    description: 'Rich in rare herbs.',
    bonuses: { gold: 0.5, wood: 0.3, stone: 0 },
    elements: [
      { shape: 'ellipse', cx: 50, cy: 65, rx: 36, ry: 14, fill: 'rgba(40,80,10,0.5)' },
      { shape: 'ellipse', cx: 35, cy: 60, rx: 18, ry: 9, fill: 'rgba(60,100,20,0.4)' },
      { shape: 'ellipse', cx: 65, cy: 63, rx: 16, ry: 8, fill: 'rgba(50,90,15,0.4)' },
      { shape: 'rect', x: 46, y: 35, w: 3, h: 22, fill: '#5a7a20', rx: 2 },
      { shape: 'ellipse', cx: 47, cy: 34, rx: 10, ry: 6, fill: '#7aaa30' },
      { shape: 'rect', x: 60, y: 40, w: 2, h: 18, fill: '#4a6a18', rx: 1 },
      { shape: 'ellipse', cx: 61, cy: 38, rx: 8, ry: 5, fill: '#6a9a25' },
    ],
  },
  ruins: {
    label: 'Ancient Ruins',
    bg: 'linear-gradient(160deg, #1a1510 0%, #2a2018 50%, #1a1810 100%)',
    accent: '#c8a060',
    icon: '🏛️',
    description: 'High gold yield.',
    bonuses: { gold: 1.0, wood: 0, stone: 0.3 },
    elements: [
      { shape: 'ellipse', cx: 50, cy: 78, rx: 38, ry: 7, fill: 'rgba(50,40,20,0.4)' },
      { shape: 'pillar', cx: 28, cy: 50, h: 30 },
      { shape: 'pillar', cx: 42, cy: 45, h: 35, broken: true },
      { shape: 'pillar', cx: 56, cy: 48, h: 32 },
      { shape: 'pillar', cx: 70, cy: 53, h: 27, broken: true },
      { shape: 'rect', x: 20, y: 68, w: 60, h: 5, fill: '#5a4828', rx: 1 },
    ],
  },
  village: {
    label: 'Village',
    bg: 'linear-gradient(160deg, #2a1e10 0%, #4a3420 50%, #382810 100%)',
    accent: '#d4824a',
    icon: '🏘️',
    description: 'Good all-round production.',
    bonuses: { gold: 0.4, wood: 0.4, stone: 0.2 },
    elements: [
      { shape: 'ellipse', cx: 50, cy: 78, rx: 38, ry: 7, fill: 'rgba(60,40,10,0.4)' },
      { shape: 'house', cx: 32, cy: 55, w: 22, h: 18 },
      { shape: 'house', cx: 60, cy: 52, w: 26, h: 20, tall: true },
    ],
  },
};

// ── SVG tile renderer ────────────────────────────────────────────────────────

function TileSVG({ type, size = 80 }) {
  const visual = TILE_VISUALS[type] || TILE_VISUALS.plains;
  const id = `grad-${type}`;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.5" y2="1">
          {visual.bg.match(/#[0-9a-f]{6}/gi)?.map((c, i, arr) => (
            <stop key={i} offset={`${(i / (arr.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Base hex fill */}
      <polygon
        points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
        fill={`url(#${id})`}
        stroke={visual.accent}
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* Render elements */}
      {visual.elements?.map((el, i) => <TileElement key={i} el={el} accent={visual.accent} />)}
    </svg>
  );
}

function TileElement({ el, accent }) {
  switch (el.shape) {
    case 'ellipse':
      return <ellipse cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} fill={el.fill} />;
    case 'rect':
      return <rect x={el.x} y={el.y} width={el.w} height={el.h} fill={el.fill} rx={el.rx || 0} />;
    case 'tree': {
      const { cx, cy, size, dark } = el;
      const col = dark ? '#1a4a1a' : '#2a6a2a';
      const col2 = dark ? '#0e2e0e' : '#1e4e1e';
      return (
        <g>
          <rect x={cx - 2} y={cy + size * 0.3} width={4} height={size * 0.5} fill="#5a3a1a" rx={1} />
          <polygon points={`${cx},${cy - size * 0.5} ${cx - size * 0.55},${cy + size * 0.3} ${cx + size * 0.55},${cy + size * 0.3}`} fill={col} />
          <polygon points={`${cx},${cy - size * 0.7} ${cx - size * 0.4},${cy} ${cx + size * 0.4},${cy}`} fill={col2} />
        </g>
      );
    }
    case 'mountain': {
      const { cx, cy, w, h, fill, snow } = el;
      const bx = cx - w / 2, peak = cy - h;
      return (
        <g>
          <polygon points={`${cx},${peak} ${bx},${cy + 10} ${cx + w / 2},${cy + 10}`} fill={fill} />
          {snow && <polygon points={`${cx},${peak} ${cx - 10},${peak + 12} ${cx + 10},${peak + 12}`} fill="rgba(240,240,255,0.85)" />}
        </g>
      );
    }
    case 'crystal': {
      const { cx, cy, fill, small } = el;
      const s = small ? 0.6 : 1;
      return (
        <g>
          <polygon points={`${cx},${cy - 15 * s} ${cx - 7 * s},${cy} ${cx},${cy + 12 * s} ${cx + 7 * s},${cy}`} fill={fill} opacity="0.9" />
          <polygon points={`${cx},${cy - 15 * s} ${cx - 7 * s},${cy} ${cx},${cy - 4 * s}`} fill="rgba(255,255,255,0.4)" />
        </g>
      );
    }
    case 'sparkle': {
      const { cx, cy } = el;
      return (
        <g fill="#fff8a0" opacity="0.9">
          {[[0,-8],[8,0],[0,8],[-8,0]].map(([dx, dy], i) => (
            <line key={i} x1={cx} y1={cy} x2={cx + dx} y2={cy + dy} stroke="#fff8a0" strokeWidth="1.5" />
          ))}
        </g>
      );
    }
    case 'wave': {
      const { cy } = el;
      return (
        <path d={`M 15,${cy} Q 28,${cy - 5} 40,${cy} Q 53,${cy + 5} 65,${cy} Q 78,${cy - 5} 85,${cy}`}
          fill="none" stroke="rgba(100,180,255,0.35)" strokeWidth="1.5" />
      );
    }
    case 'pillar': {
      const { cx, cy, h, broken } = el;
      const top = cy - h;
      return (
        <g>
          <rect x={cx - 4} y={broken ? top + 10 : top} width={8} height={broken ? h - 10 : h} fill="#7a6840" rx={1} />
          {!broken && <rect x={cx - 5} y={top - 3} width={10} height={4} fill="#8a7848" rx={1} />}
          <rect x={cx - 5} y={cy} width={10} height={4} fill="#8a7848" rx={1} />
        </g>
      );
    }
    case 'house': {
      const { cx, cy, w, h, tall } = el;
      const roofH = tall ? h * 0.6 : h * 0.45;
      return (
        <g>
          <rect x={cx - w / 2} y={cy - h / 2 + roofH} width={w} height={h - roofH} fill="#6a4828" rx={1} />
          <polygon points={`${cx},${cy - h / 2} ${cx - w / 2},${cy - h / 2 + roofH} ${cx + w / 2},${cy - h / 2 + roofH}`} fill="#8a3818" />
          <rect x={cx - 3} y={cy + h / 2 - roofH - 8} width={6} height={8} fill="#3a2010" rx={1} />
          <rect x={cx - w / 4 - 3} y={cy - 4} width={5} height={5} fill="rgba(255,220,100,0.6)" rx={1} />
        </g>
      );
    }
    default:
      return null;
  }
}

// ── Hex grid math ─────────────────────────────────────────────────────────────

function hexToPixel(q, r, size) {
  const isOdd = r % 2 !== 0;
  const x = q * size * 1.12 + (isOdd ? size * 0.56 : 0);
  const y = r * size * 0.97;
  return { x, y };
}

// ── Main WorldMap component ───────────────────────────────────────────────────

export default function WorldMap({ playerState, onStateUpdate }) {
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [travelMsg, setTravelMsg] = useState('');
  const [travelling, setTravelling] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const fetchMap = useCallback(async () => {
    try {
      const data = await api.getMap();
      setTiles(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMap(); }, [fetchMap]);

  // Refresh map every 10s to show other players moving
  useEffect(() => {
    const interval = setInterval(fetchMap, 10000);
    return () => clearInterval(interval);
  }, [fetchMap]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const playerQ = playerState?.tileQ ?? 3;
  const playerR = playerState?.tileR ?? 3;

  // Get neighbors of current player tile
  const isOdd = playerR % 2 !== 0;
  const neighborDirs = isOdd
    ? [[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]
    : [[1,0],[-1,0],[0,-1],[-1,-1],[0,1],[-1,1]];
  const neighborSet = new Set(
    neighborDirs.map(([dq, dr]) => `${playerQ + dq},${playerR + dr}`)
  );

  async function handleTravel(tile) {
    if (travelling || cooldown > 0) return;
    const key = `${tile.q},${tile.r}`;
    const visual = TILE_VISUALS[tile.type];
    if (visual?.impassable) { setTravelMsg("Can't travel here — impassable!"); return; }
    if (!neighborSet.has(key)) { setTravelMsg('You can only move to adjacent tiles.'); setTimeout(() => setTravelMsg(''), 2500); return; }
    if (tile.q === playerQ && tile.r === playerR) return;

    setTravelling(true);
    try {
      const newState = await api.travel(tile.q, tile.r);
      onStateUpdate(newState);
      await fetchMap();
      setTravelMsg(`Moved to ${visual?.label || tile.type}!`);
      setCooldown(5);
    } catch (e) {
      setTravelMsg(e.message);
    } finally {
      setTravelling(false);
      setTimeout(() => setTravelMsg(''), 3000);
    }
  }

  const TILE_SIZE = 62;
  const gridW = 7 * TILE_SIZE * 1.12 + TILE_SIZE * 0.56 + 20;
  const gridH = 7 * TILE_SIZE * 0.97 + TILE_SIZE + 20;

  const selectedTile = selected ? tiles.find(t => t.q === selected.q && t.r === selected.r) : null;
  const selectedVisual = selectedTile ? (TILE_VISUALS[selectedTile.type] || TILE_VISUALS.plains) : null;
  const currentTile = tiles.find(t => t.q === playerQ && t.r === playerR);
  const currentVisual = currentTile ? (TILE_VISUALS[currentTile.type] || TILE_VISUALS.plains) : null;

  if (loading) return (
    <div className="map-loading">
      <div className="loading-spinner" />
      <p>Charting the realm...</p>
    </div>
  );

  return (
    <div className="world-map-page">
      <div className="map-layout">

        {/* ── Left panel ── */}
        <div className="map-sidebar">
          <h2 className="panel-title">🗺️ World Map</h2>

          {/* Current location */}
          <div className="map-info-card current-location">
            <div className="map-info-label">Current Location</div>
            <div className="map-info-tile">
              <TileSVG type={currentTile?.type || 'plains'} size={52} />
              <div>
                <div className="map-tile-name">{currentVisual?.label || '—'}</div>
                <div className="map-tile-desc">{currentVisual?.description}</div>
              </div>
            </div>
            {playerState?.tileBonuses && Object.values(playerState.tileBonuses).some(v => v > 0) && (
              <div className="map-bonuses">
                <div className="map-bonus-label">Tile Bonuses</div>
                {playerState.tileBonuses.gold_per_sec > 0 && (
                  <div className="map-bonus-row">🪙 +{playerState.tileBonuses.gold_per_sec.toFixed(1)}/s gold</div>
                )}
                {playerState.tileBonuses.wood_per_sec > 0 && (
                  <div className="map-bonus-row">🪵 +{playerState.tileBonuses.wood_per_sec.toFixed(1)}/s wood</div>
                )}
                {playerState.tileBonuses.stone_per_sec > 0 && (
                  <div className="map-bonus-row">🪨 +{playerState.tileBonuses.stone_per_sec.toFixed(1)}/s stone</div>
                )}
              </div>
            )}
          </div>

          {/* Selected tile info */}
          {selectedTile && selectedTile.q !== playerQ || selectedTile?.r !== playerR ? (
            <div className="map-info-card selected-tile">
              <div className="map-info-label">Selected Tile</div>
              <div className="map-info-tile">
                <TileSVG type={selectedTile.type} size={52} />
                <div>
                  <div className="map-tile-name">{selectedVisual?.label}</div>
                  <div className="map-tile-desc">{selectedVisual?.description}</div>
                </div>
              </div>
              {selectedVisual && !selectedVisual.impassable && (
                <div className="map-bonuses">
                  <div className="map-bonus-label">Bonuses if here</div>
                  {(selectedVisual.bonuses.gold > 0) && <div className="map-bonus-row">🪙 +{selectedVisual.bonuses.gold}/s gold</div>}
                  {(selectedVisual.bonuses.wood > 0) && <div className="map-bonus-row">🪵 +{selectedVisual.bonuses.wood}/s wood</div>}
                  {(selectedVisual.bonuses.stone > 0) && <div className="map-bonus-row">🪨 +{selectedVisual.bonuses.stone}/s stone</div>}
                </div>
              )}
              {neighborSet.has(`${selectedTile.q},${selectedTile.r}`) && !selectedVisual?.impassable && (
                <button
                  className={`btn-travel ${cooldown > 0 ? 'cooldown' : ''}`}
                  onClick={() => handleTravel(selectedTile)}
                  disabled={travelling || cooldown > 0}
                >
                  {cooldown > 0 ? `Wait ${cooldown}s...` : travelling ? 'Travelling...' : `→ Travel Here`}
                </button>
              )}
              {selectedVisual?.impassable && <div className="map-impassable">⚠️ Impassable</div>}
              {!neighborSet.has(`${selectedTile.q},${selectedTile.r}`) && !selectedVisual?.impassable && (
                <div className="map-too-far">Too far — move closer first</div>
              )}
            </div>
          ) : null}

          {/* Travel feedback */}
          {travelMsg && <div className="travel-msg">{travelMsg}</div>}

          {/* Legend */}
          <div className="map-legend">
            <div className="map-info-label">Tile Types</div>
            {Object.entries(TILE_VISUALS).map(([type, v]) => (
              <div key={type} className="legend-row">
                <TileSVG type={type} size={28} />
                <span>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Hex grid ── */}
        <div className="map-grid-wrapper">
          <div className="map-grid-scroll">
            <svg
              viewBox={`-10 -10 ${gridW} ${gridH}`}
              style={{ width: '100%', maxWidth: gridW + 20, display: 'block' }}
            >
              {tiles.map(tile => {
                const { x, y } = hexToPixel(tile.q, tile.r, TILE_SIZE);
                const isPlayer = tile.q === playerQ && tile.r === playerR;
                const isNeighbor = neighborSet.has(`${tile.q},${tile.r}`);
                const isSelected = selected?.q === tile.q && selected?.r === tile.r;
                const visual = TILE_VISUALS[tile.type] || TILE_VISUALS.plains;
                const cx = x + TILE_SIZE / 2;
                const cy = y + TILE_SIZE / 2;
                const HEX_PTS = [
                  [cx, cy - TILE_SIZE * 0.48],
                  [cx + TILE_SIZE * 0.44, cy - TILE_SIZE * 0.24],
                  [cx + TILE_SIZE * 0.44, cy + TILE_SIZE * 0.24],
                  [cx, cy + TILE_SIZE * 0.48],
                  [cx - TILE_SIZE * 0.44, cy + TILE_SIZE * 0.24],
                  [cx - TILE_SIZE * 0.44, cy - TILE_SIZE * 0.24],
                ].map(p => p.join(',')).join(' ');

                return (
                  <g
                    key={`${tile.q},${tile.r}`}
                    onClick={() => {
                      setSelected(isSelected ? null : { q: tile.q, r: tile.r });
                      if (isNeighbor && !visual.impassable) handleTravel(tile);
                    }}
                    style={{ cursor: isPlayer ? 'default' : isNeighbor && !visual.impassable ? 'pointer' : 'pointer' }}
                  >
                    {/* Glow for neighbor tiles */}
                    {isNeighbor && !visual.impassable && (
                      <polygon points={HEX_PTS} fill="none" stroke={visual.accent} strokeWidth="2" opacity="0.6"
                        style={{ filter: `drop-shadow(0 0 4px ${visual.accent})` }} />
                    )}

                    {/* Foreign object for tile SVG art */}
                    <foreignObject x={x} y={y} width={TILE_SIZE} height={TILE_SIZE}>
                      <div xmlns="http://www.w3.org/1999/xhtml" style={{
                        width: TILE_SIZE, height: TILE_SIZE,
                        clipPath: 'polygon(50% 2%, 94% 25%, 94% 75%, 50% 98%, 6% 75%, 6% 25%)',
                        opacity: isPlayer ? 1 : isNeighbor ? 0.95 : 0.65,
                        transition: 'opacity 0.2s',
                      }}>
                        <TileSVG type={tile.type} size={TILE_SIZE} />
                      </div>
                    </foreignObject>

                    {/* Hex border */}
                    <polygon points={HEX_PTS} fill="none"
                      stroke={isPlayer ? '#f5c518' : isSelected ? visual.accent : 'rgba(255,255,255,0.12)'}
                      strokeWidth={isPlayer ? 2.5 : isSelected ? 2 : 1} />

                    {/* Player marker */}
                    {isPlayer && (
                      <g>
                        <circle cx={cx} cy={cy} r={10} fill="rgba(0,0,0,0.7)" />
                        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="12">⚔️</text>
                      </g>
                    )}

                    {/* Other players */}
                    {tile.players?.filter(p => true).length > 0 && !isPlayer && (
                      <circle cx={cx + 14} cy={cy - 14} r={8} fill="rgba(80,140,200,0.85)"
                        stroke="#4a8adf" strokeWidth="1" />
                    )}

                    {/* Move indicator */}
                    {isNeighbor && !visual.impassable && !isPlayer && (
                      <circle cx={cx} cy={cy} r={5} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="map-grid-hint">Click an adjacent tile to travel · ⚔️ = you · glowing border = reachable</div>
        </div>
      </div>
    </div>
  );
}
