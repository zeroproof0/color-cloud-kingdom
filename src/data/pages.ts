export interface Region {
  id: string
  d: string
}

export interface ColoringPage {
  label: string
  regions: Region[]
}

const circ = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`

const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`

const rect = (x: number, y: number, w: number, h: number) =>
  `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`

const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
  `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`

/** Upper half-disc sitting on the line y=cy (sunsets, hair, shells). */
const semi = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`

/** Half-annulus rainbow band centered on (cx, cy), outer radius R, inner radius r. */
const band = (cx: number, cy: number, R: number, r: number) =>
  `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx - r} ${cy} Z`

/** Square rotated 45° (softball bases). */
const diamond = (cx: number, cy: number, s: number) =>
  `M ${cx} ${cy - s} L ${cx + s} ${cy} L ${cx} ${cy + s} L ${cx - s} ${cy} Z`

/** Five-point star with outer radius R and inner radius r. */
const star = (cx: number, cy: number, R: number, r: number) => {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r
    const a = (Math.PI * i) / 5 - Math.PI / 2
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

/** Thin rotated quadrilateral (the softball bat). */
const quad = (
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number,
) => `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`

function flowerRegions(): Region[] {
  const r: Region[] = [{ id: 'bg', d: rect(4, 4, 892, 592) }]
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
    r.push({ id: 'petal' + i, d: circ(450 + Math.cos(a) * 100, 230 + Math.sin(a) * 100, 62) })
  }
  r.push({ id: 'stem', d: rect(438, 300, 24, 210) })
  r.push({ id: 'leafL', d: ell(380, 430, 55, 28) })
  r.push({ id: 'leafR', d: ell(520, 470, 55, 28) })
  r.push({ id: 'center', d: circ(450, 230, 58) })
  return r
}

function houseRegions(): Region[] {
  return [
    { id: 'bg', d: rect(4, 4, 892, 592) },
    { id: 'sun', d: circ(790, 90, 58) },
    { id: 'grass', d: rect(4, 500, 892, 96) },
    { id: 'wall', d: rect(280, 260, 340, 240) },
    { id: 'roof', d: tri(250, 260, 650, 260, 450, 120) },
    { id: 'door', d: rect(420, 380, 70, 120) },
    { id: 'winL', d: rect(310, 300, 70, 66) },
    { id: 'winR', d: rect(520, 300, 70, 66) },
    { id: 'cloud', d: ell(140, 100, 80, 40) },
  ]
}

function caterpillarRegions(): Region[] {
  const r: Region[] = [{ id: 'bg', d: rect(4, 4, 892, 592) }]
  r.push({ id: 'sun', d: circ(110, 100, 55) })
  for (let i = 0; i < 5; i++) {
    r.push({ id: 'seg' + i, d: circ(640 - i * 95, 400 + (i % 2 ? -22 : 0), 60) })
  }
  r.push({ id: 'head', d: circ(735, 370, 68) })
  r.push({ id: 'antL', d: circ(705, 285, 14) })
  r.push({ id: 'antR', d: circ(768, 282, 14) })
  r.push({ id: 'grass', d: rect(4, 480, 892, 116) })
  return r
}

/** Merry the bear and Biscuit the beagle sitting together, watching the sunset. */
function sunsetRegions(): Region[] {
  return [
    { id: 'bg', d: rect(4, 4, 892, 592) },
    { id: 'sun', d: semi(450, 420, 55) },
    { id: 'cloudL', d: ell(160, 130, 75, 32) },
    { id: 'cloudR', d: ell(730, 100, 80, 35) },
    { id: 'ground', d: rect(4, 420, 892, 176) },
    { id: 'bearBody', d: ell(330, 505, 72, 60) },
    { id: 'bearTail', d: circ(252, 522, 16) },
    { id: 'bearEarL', d: circ(292, 336, 19) },
    { id: 'bearEarR', d: circ(368, 336, 19) },
    { id: 'bearHead', d: circ(330, 400, 55) },
    { id: 'pupBody', d: ell(558, 512, 60, 52) },
    { id: 'pupTail', d: circ(630, 530, 14) },
    { id: 'pupHead', d: circ(558, 420, 46) },
    { id: 'pupEarL', d: ell(520, 428, 15, 32) },
    { id: 'pupEarR', d: ell(596, 428, 15, 32) },
  ]
}

/** Beach with waves, sand, and ocean. */
function beachRegions(): Region[] {
  return [
    { id: 'bg', d: rect(4, 4, 892, 592) },
    { id: 'sun', d: circ(120, 100, 55) },
    { id: 'cloud', d: ell(620, 95, 80, 35) },
    { id: 'ocean', d: rect(4, 290, 892, 160) },
    { id: 'wave1', d: ell(190, 290, 65, 20) },
    { id: 'wave2', d: ell(430, 290, 65, 20) },
    { id: 'wave3', d: ell(670, 290, 65, 20) },
    { id: 'sand', d: rect(4, 450, 892, 146) },
    { id: 'ball', d: circ(710, 505, 42) },
    { id: 'starfish', d: star(200, 510, 42, 18) },
    { id: 'shell', d: semi(450, 535, 32) },
  ]
}

/** A big rainbow between two clouds. */
function rainbowRegions(): Region[] {
  const r: Region[] = [
    { id: 'bg', d: rect(4, 4, 892, 592) },
    { id: 'sun', d: circ(105, 95, 50) },
    { id: 'grass', d: rect(4, 500, 892, 96) },
  ]
  const radii = [320, 280, 240, 200, 160, 120, 80]
  for (let i = 0; i < 6; i++) {
    r.push({ id: 'arc' + i, d: band(450, 470, radii[i], radii[i + 1]) })
  }
  r.push({ id: 'cloudL', d: ell(130, 475, 90, 42) })
  r.push({ id: 'cloudR', d: ell(770, 475, 90, 42) })
  return r
}

/** Fairytale castle with three towers and a flag. */
function castleRegions(): Region[] {
  return [
    { id: 'bg', d: rect(4, 4, 892, 592) },
    { id: 'cloud', d: ell(140, 100, 78, 34) },
    { id: 'sun', d: circ(795, 85, 48) },
    { id: 'grass', d: rect(4, 470, 892, 126) },
    { id: 'wall', d: rect(330, 250, 240, 220) },
    { id: 'towerL', d: rect(235, 210, 95, 260) },
    { id: 'towerR', d: rect(570, 210, 95, 260) },
    { id: 'roofL', d: tri(220, 210, 345, 210, 282, 110) },
    { id: 'roofR', d: tri(555, 210, 680, 210, 617, 110) },
    { id: 'centerTower', d: rect(402, 155, 96, 95) },
    { id: 'centerRoof', d: tri(390, 155, 510, 155, 450, 65) },
    { id: 'flag', d: tri(450, 65, 450, 30, 500, 47) },
    { id: 'door', d: 'M 415 470 L 415 385 A 35 35 0 0 1 485 385 L 485 470 Z' },
    { id: 'winL', d: rect(266, 265, 34, 46) },
    { id: 'winR', d: rect(601, 265, 34, 46) },
    { id: 'winC', d: rect(434, 185, 32, 40) },
  ]
}

/** Softball field with a girl batter (ponytail!) at the plate. */
function softballRegions(): Region[] {
  return [
    { id: 'bg', d: rect(4, 4, 892, 592) },
    { id: 'sun', d: circ(800, 88, 48) },
    { id: 'cloud', d: ell(170, 95, 80, 34) },
    { id: 'grass', d: rect(4, 280, 892, 316) },
    { id: 'infield', d: ell(430, 500, 330, 130) },
    { id: 'base3', d: diamond(280, 480, 20) },
    { id: 'base2', d: diamond(430, 405, 20) },
    { id: 'base1', d: diamond(560, 480, 20) },
    { id: 'plate', d: diamond(640, 560, 26) },
    { id: 'ball', d: circ(270, 200, 28) },
    { id: 'legL', d: rect(674, 455, 22, 100) },
    { id: 'legR', d: rect(706, 455, 22, 100) },
    { id: 'bat', d: quad(664, 356, 608, 262, 622, 253, 678, 347) },
    { id: 'shirt', d: rect(668, 360, 66, 100) },
    { id: 'head', d: circ(701, 315, 40) },
    { id: 'hair', d: semi(701, 315, 40) },
    { id: 'ponytail', d: ell(752, 335, 20, 36) },
  ]
}

export const PAGES: ColoringPage[] = [
  { label: 'Flower', regions: flowerRegions() },
  { label: 'House', regions: houseRegions() },
  { label: 'Caterpillar', regions: caterpillarRegions() },
  { label: 'Sunset Pals', regions: sunsetRegions() },
  { label: 'Beach Day', regions: beachRegions() },
  { label: 'Rainbow', regions: rainbowRegions() },
  { label: 'Castle', regions: castleRegions() },
  { label: 'Softball', regions: softballRegions() },
]
