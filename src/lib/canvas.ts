export const CANVAS_W = 900
export const CANVAS_H = 600

export interface Point {
  x: number
  y: number
}

/** Map a pointer event to logical 900×600 canvas coordinates. */
export function canvasPoint(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement): Point {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) * CANVAS_W) / rect.width,
    y: ((e.clientY - rect.top) * CANVAS_H) / rect.height,
  }
}

export function strokeSegment(
  canvas: HTMLCanvasElement,
  from: Point,
  to: Point,
  color: string,
  size: number,
  erase: boolean,
) {
  const ctx = canvas.getContext('2d')!
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
  ctx.strokeStyle = color
  ctx.lineWidth = size
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  canvas.getContext('2d')!.clearRect(0, 0, CANVAS_W, CANVAS_H)
}

export function restoreCanvas(canvas: HTMLCanvasElement, dataUrl: string) {
  const img = new Image()
  img.onload = () => {
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(img, 0, 0)
  }
  img.src = dataUrl
}

export type StickerKind = 'heart' | 'star' | 'rainbow' | 'cloud' | 'bear' | 'pup'

/** Stamp a sticker onto the canvas at the given logical point (~0.8 scale, 70–80px). */
export function stampSticker(canvas: HTMLCanvasElement, kind: StickerKind, p: Point) {
  const ctx = canvas.getContext('2d')!
  ctx.globalCompositeOperation = 'source-over'
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.scale(0.8, 0.8)
  if (kind === 'heart') {
    ctx.fillStyle = '#e4544f'
    ctx.beginPath()
    ctx.moveTo(0, 36)
    ctx.bezierCurveTo(-30, 12, -42, -6, -34, -22)
    ctx.bezierCurveTo(-26, -38, -6, -36, 0, -20)
    ctx.bezierCurveTo(6, -36, 26, -38, 34, -22)
    ctx.bezierCurveTo(42, -6, 30, 12, 0, 36)
    ctx.fill()
  } else if (kind === 'star') {
    ctx.fillStyle = '#f5c84c'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 40 : 17
      const a = (Math.PI * i) / 5 - Math.PI / 2
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.fill()
  } else if (kind === 'rainbow') {
    const bands: Array<[string, number]> = [
      ['#e4544f', 40],
      ['#f28c3b', 33],
      ['#f5c84c', 26],
      ['#6db56a', 19],
      ['#5a8fd6', 12],
    ]
    ctx.lineWidth = 7
    for (const [c, r] of bands) {
      ctx.strokeStyle = c
      ctx.beginPath()
      ctx.arc(0, 16, r, Math.PI, 0)
      ctx.stroke()
    }
  } else if (kind === 'cloud') {
    ctx.fillStyle = '#c7ddf5'
    const puffs: Array<[number, number, number, number]> = [
      [-16, 8, 20, 14],
      [14, 6, 22, 16],
      [0, -6, 18, 14],
    ]
    for (const [x, y, rx, ry] of puffs) {
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (kind === 'bear') {
    ctx.fillStyle = '#f2a0bd'
    for (const [x, y, r] of [
      [-22, -24, 12],
      [22, -24, 12],
    ] as Array<[number, number, number]>) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(0, 4, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fbe3ec'
    ctx.beginPath()
    ctx.ellipse(0, 14, 15, 11, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#4c4160'
    ctx.beginPath()
    ctx.arc(-12, -2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(12, -2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(0, 10, 5, 4, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (kind === 'pup') {
    ctx.fillStyle = '#a4715a'
    for (const [x, y] of [
      [-26, 0],
      [26, 0],
    ] as Array<[number, number]>) {
      ctx.beginPath()
      ctx.ellipse(x, y, 10, 22, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#f7ecd9'
    ctx.beginPath()
    ctx.arc(0, 0, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#a4715a'
    ctx.beginPath()
    ctx.arc(10, -8, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#4c4160'
    ctx.beginPath()
    ctx.arc(-9, -6, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(10, -6, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(0, 9, 6, 5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
