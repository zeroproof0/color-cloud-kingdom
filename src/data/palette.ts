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
  { name: 'Yellow', hex: '#f5c84c' },
  { name: 'Blue', hex: '#5a8fd6' },
  { name: 'White', hex: '#fdfcf8' },
  { name: 'Black', hex: '#4a4a52' },
]

export const MIX_TABLE: Record<string, PaletteColor> = {
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
}

export interface Recipe {
  a: string
  b: string
  c: string
  text: string
}

export const RECIPES: Recipe[] = [
  { a: '#e4544f', b: '#f5c84c', c: '#f28c3b', text: 'makes orange' },
  { a: '#5a8fd6', b: '#f5c84c', c: '#6db56a', text: 'makes green' },
  { a: '#e4544f', b: '#5a8fd6', c: '#9a6fc4', text: 'makes purple' },
  { a: '#e4544f', b: '#fdfcf8', c: '#f2a0bd', text: 'makes pink' },
  { a: '#4a4a52', b: '#fdfcf8', c: '#9a9aa4', text: 'makes gray' },
  { a: '#5a8fd6', b: '#fdfcf8', c: '#a8cdf0', text: 'makes light blue' },
]

export const CONFETTI_COLORS = [
  '#e4544f',
  '#f28c3b',
  '#f5c84c',
  '#6db56a',
  '#5a8fd6',
  '#9a6fc4',
  '#f2a0bd',
]
