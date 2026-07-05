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

export const PAGES: ColoringPage[] = [
  { label: 'Flower', regions: flowerRegions() },
  { label: 'House', regions: houseRegions() },
  { label: 'Caterpillar', regions: caterpillarRegions() },
]
