// All available upgrades in the game
// Each upgrade increases a resource's per-second rate

const UPGRADES = {
  // Gold upgrades
  wooden_pickaxe: {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    description: 'A crude tool for mining gold.',
    icon: '⛏️',
    category: 'gold',
    cost: { gold: 10 },
    effect: { gold_per_sec: 0.5 },
    maxQuantity: 1,
    requires: null,
  },
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    description: 'A sturdy iron pickaxe. Much more efficient.',
    icon: '⛏️',
    category: 'gold',
    cost: { gold: 75 },
    effect: { gold_per_sec: 2 },
    maxQuantity: 1,
    requires: 'wooden_pickaxe',
  },
  gold_mine: {
    id: 'gold_mine',
    name: 'Gold Mine',
    description: 'A dedicated mine for extracting gold ore.',
    icon: '🏔️',
    category: 'gold',
    cost: { gold: 500, stone: 100 },
    effect: { gold_per_sec: 10 },
    maxQuantity: 5,
    requires: 'iron_pickaxe',
  },
  // Wood upgrades
  hand_axe: {
    id: 'hand_axe',
    name: 'Hand Axe',
    description: 'Chop wood with your bare hands... sort of.',
    icon: '🪓',
    category: 'wood',
    cost: { gold: 15 },
    effect: { wood_per_sec: 0.5 },
    maxQuantity: 1,
    requires: null,
  },
  lumber_camp: {
    id: 'lumber_camp',
    name: 'Lumber Camp',
    description: 'A camp of workers who do nothing but chop trees.',
    icon: '🌲',
    category: 'wood',
    cost: { gold: 120, wood: 50 },
    effect: { wood_per_sec: 3 },
    maxQuantity: 5,
    requires: 'hand_axe',
  },
  // Stone upgrades
  stone_chisel: {
    id: 'stone_chisel',
    name: 'Stone Chisel',
    description: 'Chip away at rocks for stone.',
    icon: '🪨',
    category: 'stone',
    cost: { gold: 20 },
    effect: { stone_per_sec: 0.4 },
    maxQuantity: 1,
    requires: null,
  },
  quarry: {
    id: 'quarry',
    name: 'Quarry',
    description: 'A massive open pit that produces stone endlessly.',
    icon: '⛰️',
    category: 'stone',
    cost: { gold: 300, stone: 50 },
    effect: { stone_per_sec: 4 },
    maxQuantity: 3,
    requires: 'stone_chisel',
  },
};

module.exports = { UPGRADES };
