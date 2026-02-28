// Hex tile types with their resource bonuses
const TILE_TYPES = {
  plains: {
    type: 'plains',
    label: 'Plains',
    description: 'Open grassland. Balanced resource production.',
    bonuses: { gold_per_sec: 0.2, wood_per_sec: 0.1, stone_per_sec: 0.1 },
  },
  forest: {
    type: 'forest',
    label: 'Forest',
    description: 'Dense woodland. Excellent for timber.',
    bonuses: { gold_per_sec: 0.1, wood_per_sec: 0.8, stone_per_sec: 0.0 },
  },
  mountain: {
    type: 'mountain',
    label: 'Mountain',
    description: 'Rocky peaks rich with stone and ore.',
    bonuses: { gold_per_sec: 0.3, wood_per_sec: 0.0, stone_per_sec: 0.8 },
  },
  goldvein: {
    type: 'goldvein',
    label: 'Gold Vein',
    description: 'A glittering seam of gold ore.',
    bonuses: { gold_per_sec: 1.2, wood_per_sec: 0.0, stone_per_sec: 0.1 },
  },
  lake: {
    type: 'lake',
    label: 'Lake',
    description: 'A tranquil lake. No resources, but peaceful.',
    bonuses: { gold_per_sec: 0.0, wood_per_sec: 0.0, stone_per_sec: 0.0 },
    impassable: true,
  },
  swamp: {
    type: 'swamp',
    label: 'Swamp',
    description: 'Murky wetlands. Slow going but rich in rare herbs.',
    bonuses: { gold_per_sec: 0.5, wood_per_sec: 0.3, stone_per_sec: 0.0 },
  },
  ruins: {
    type: 'ruins',
    label: 'Ancient Ruins',
    description: 'Crumbling remnants of a lost civilisation. High gold yield.',
    bonuses: { gold_per_sec: 1.0, wood_per_sec: 0.0, stone_per_sec: 0.3 },
  },
  village: {
    type: 'village',
    label: 'Village',
    description: 'A small settlement. Good all-round production.',
    bonuses: { gold_per_sec: 0.4, wood_per_sec: 0.4, stone_per_sec: 0.2 },
  },
};

// Fixed 7x7 hex map layout (offset grid, q = col, r = row)
// Using a hand-crafted layout for an interesting small map
const MAP_LAYOUT = [
  // row 0
  ['forest',  'forest',  'plains',  'mountain','plains',  'forest',  'forest' ],
  // row 1
  ['forest',  'plains',  'village', 'plains',  'goldvein','plains',  'mountain'],
  // row 2
  ['plains',  'swamp',   'plains',  'plains',  'plains',  'ruins',   'plains' ],
  // row 3
  ['mountain','plains',  'plains',  'village', 'plains',  'plains',  'forest' ],
  // row 4
  ['plains',  'ruins',   'lake',    'plains',  'swamp',   'plains',  'plains' ],
  // row 5
  ['forest',  'plains',  'plains',  'goldvein','plains',  'village', 'plains' ],
  // row 6
  ['mountain','forest',  'plains',  'plains',  'plains',  'forest',  'mountain'],
];

function generateTiles() {
  const tiles = [];
  for (let r = 0; r < 7; r++) {
    for (let q = 0; q < 7; q++) {
      const type = MAP_LAYOUT[r][q];
      tiles.push({ q, r, type });
    }
  }
  return tiles;
}

// Get axial neighbors for offset hex grid (odd-r offset)
function getNeighbors(q, r) {
  const isOdd = r % 2 !== 0;
  const dirs = isOdd
    ? [[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]
    : [[1,0],[-1,0],[0,-1],[-1,-1],[0,1],[-1,1]];
  return dirs
    .map(([dq, dr]) => ({ q: q + dq, r: r + dr }))
    .filter(({ q, r }) => q >= 0 && q < 7 && r >= 0 && r < 7);
}

module.exports = { TILE_TYPES, generateTiles, getNeighbors };
