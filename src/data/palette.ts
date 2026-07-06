export interface PaletteColor {
  name: string
  hex: string
}

export const COLORS: PaletteColor[] = [
  { name: 'red', hex: '#e4544f' },
  { name: 'orange', hex: '#f28c3b' },
  { name: 'yellow', hex: '#f5c84c' },
  { name: 'green', hex: '#6db56a' },
  { name: 'blue', hex: '#5a8fd6' },
  { name: 'purple', hex: '#9a6fc4' },
  { name: 'pink', hex: '#f2a0bd' },
  { name: 'brown', hex: '#a4715a' },
  { name: 'black', hex: '#4a4a52' },
  { name: 'white', hex: '#fdfcf8' },
]

export const MIX_INPUTS: PaletteColor[] = [
  { name: 'Red', hex: '#e4544f' },
  { name: 'Orange', hex: '#f28c3b' },
  { name: 'Yellow', hex: '#f5c84c' },
  { name: 'Green', hex: '#6db56a' },
  { name: 'Blue', hex: '#5a8fd6' },
  { name: 'Purple', hex: '#9a6fc4' },
  { name: 'Pink', hex: '#f2a0bd' },
  { name: 'Brown', hex: '#a4715a' },
  { name: 'White', hex: '#fdfcf8' },
  { name: 'Black', hex: '#4a4a52' },
]

// Every unordered pair of the 10 paints (45 combos). Keys are the two paint
// names joined with '+' in alphabetical order — the lookup sorts before joining.
export const MIX_TABLE: Record<string, PaletteColor> = {
  // classics
  'Red+Yellow': { name: 'Orange', hex: '#f28c3b' },
  'Blue+Yellow': { name: 'Green', hex: '#6db56a' },
  'Blue+Red': { name: 'Purple', hex: '#9a6fc4' },
  'Red+White': { name: 'Pink', hex: '#f2a0bd' },
  'Blue+White': { name: 'Light blue', hex: '#a8cdf0' },
  'White+Yellow': { name: 'Cream', hex: '#f8e8bc' },
  'Black+White': { name: 'Gray', hex: '#9a9aa4' },
  'Black+Red': { name: 'Dark red', hex: '#8e3230' },
  'Black+Yellow': { name: 'Olive', hex: '#8a8340' },
  'Black+Blue': { name: 'Navy', hex: '#31456e' },
  // with orange
  'Orange+Red': { name: 'Red-orange', hex: '#ea6a3f' },
  'Orange+Yellow': { name: 'Amber', hex: '#f0a63f' },
  'Green+Orange': { name: 'Khaki', hex: '#a08448' },
  'Blue+Orange': { name: 'Cocoa', hex: '#8a6a52' },
  'Orange+Purple': { name: 'Russet', hex: '#a2603f' },
  'Orange+Pink': { name: 'Coral', hex: '#f28a72' },
  'Brown+Orange': { name: 'Cinnamon', hex: '#bd7440' },
  'Orange+White': { name: 'Peach', hex: '#f8b98a' },
  'Black+Orange': { name: 'Rust', hex: '#a05a28' },
  // with green
  'Green+Red': { name: 'Brown', hex: '#a4715a' },
  'Green+Yellow': { name: 'Lime', hex: '#b4cc5a' },
  'Blue+Green': { name: 'Teal', hex: '#4a9a94' },
  'Green+Purple': { name: 'Slate green', hex: '#6f7a68' },
  'Green+Pink': { name: 'Sage', hex: '#8fa882' },
  'Brown+Green': { name: 'Moss', hex: '#6e8850' },
  'Green+White': { name: 'Mint', hex: '#a9d9a8' },
  'Black+Green': { name: 'Forest green', hex: '#3d6b40' },
  // with purple
  'Purple+Red': { name: 'Magenta', hex: '#c05a9e' },
  'Purple+Yellow': { name: 'Mud', hex: '#9a8668' },
  'Blue+Purple': { name: 'Indigo', hex: '#5f64c8' },
  'Pink+Purple': { name: 'Orchid', hex: '#c387cf' },
  'Brown+Purple': { name: 'Plum', hex: '#7d5670' },
  'Purple+White': { name: 'Lavender', hex: '#c9aede' },
  'Black+Purple': { name: 'Deep purple', hex: '#5a3f78' },
  // with pink
  'Pink+Red': { name: 'Rose', hex: '#ec7086' },
  'Pink+Yellow': { name: 'Apricot', hex: '#f7c092' },
  'Blue+Pink': { name: 'Periwinkle', hex: '#8f9ede' },
  'Brown+Pink': { name: 'Rosy brown', hex: '#b98878' },
  'Pink+White': { name: 'Light pink', hex: '#f9ccdc' },
  'Black+Pink': { name: 'Dusty rose', hex: '#b07890' },
  // with brown
  'Brown+Red': { name: 'Chestnut', hex: '#9c5a48' },
  'Brown+Yellow': { name: 'Caramel', hex: '#c99a52' },
  'Blue+Brown': { name: 'Stormy blue', hex: '#5c6678' },
  'Brown+White': { name: 'Tan', hex: '#cfa98a' },
  'Black+Brown': { name: 'Dark brown', hex: '#5a4236' },
}

export interface Recipe {
  a: string
  b: string
  c: string
  text: string
}

const paintHex = (name: string) => MIX_INPUTS.find((p) => p.name === name)!.hex

const recipe = (a: string, b: string): Recipe => {
  const result = MIX_TABLE[[a, b].sort().join('+')]
  return { a: paintHex(a), b: paintHex(b), c: result.hex, text: `makes ${result.name.toLowerCase()}` }
}

// A curated dozen for the reference grid — the classics plus fun discoveries.
export const RECIPES: Recipe[] = [
  recipe('Red', 'Yellow'),
  recipe('Blue', 'Yellow'),
  recipe('Red', 'Blue'),
  recipe('Red', 'White'),
  recipe('Black', 'White'),
  recipe('Blue', 'White'),
  recipe('Blue', 'Green'),
  recipe('Orange', 'Pink'),
  recipe('Green', 'White'),
  recipe('Purple', 'White'),
  recipe('Red', 'Green'),
  recipe('Blue', 'Black'),
]

// Every distinct pair must mix to something — fail loudly at load if one is missing.
for (let i = 0; i < MIX_INPUTS.length; i++) {
  for (let j = i + 1; j < MIX_INPUTS.length; j++) {
    const key = [MIX_INPUTS[i].name, MIX_INPUTS[j].name].sort().join('+')
    if (!MIX_TABLE[key]) throw new Error(`MIX_TABLE is missing a recipe for ${key}`)
  }
}

export const CONFETTI_COLORS = [
  '#e4544f',
  '#f28c3b',
  '#f5c84c',
  '#6db56a',
  '#5a8fd6',
  '#9a6fc4',
  '#f2a0bd',
]
