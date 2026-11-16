// Public entry point of the seeded random generator shared by the game rules packages.
export {
  createRandomState,
  drawRandomFraction,
  drawRandomItem,
  drawWeightedItem,
  isRandomState,
  type RandomDraw,
  type RandomState,
} from './seeded-random.js';
