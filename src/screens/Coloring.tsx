import { useEffect, useRef, useState } from 'react'
import { COLORS } from '../data/palette'
import { PAGES } from '../data/pages'
import {
  CANVAS_W,
  CANVAS_H,
  canvasPoint,
  strokeSegment,
  clearCanvas,
  restoreCanvas,
  type Point,
} from '../lib/canvas'
import { loadJSON, saveJSON, loadString, saveString } from '../lib/storage'

type Fills = Record<number, Record<string, string>>

const FILLS_KEY = 'coloring-fills'
const canvasKey = (pageIdx: number) => `coloring-canvas-${pageIdx}`

export function ColoringScreen() {
  const [pageIdx, setPageIdx] = useState(0)
  const [paint, setPaint] = useState('#e4544f')
  const [mode, setMode] = useState<'fill' | 'brush'>('fill')
  const [fills, setFills] = useState<Fills>(() => loadJSON<Fills>(FILLS_KEY, {}))

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painting = useRef(false)
  const last = useRef<Point>({ x: 0, y: 0 })

  // Restore this page's saved brush layer whenever the page changes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    clearCanvas(canvas)
    const saved = loadString(canvasKey(pageIdx))
    if (saved) restoreCanvas(canvas, saved)
  }, [pageIdx])

  const page = PAGES[pageIdx]
  const pageFills = fills[pageIdx] ?? {}

  const fillRegion = (id: string) => {
    if (mode !== 'fill') return
    const next = { ...fills, [pageIdx]: { ...pageFills, [id]: paint } }
    setFills(next)
    saveJSON(FILLS_KEY, next)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'brush') return
    const canvas = canvasRef.current!
    e.currentTarget.setPointerCapture(e.pointerId)
    painting.current = true
    const p = canvasPoint(e, canvas)
    last.current = p
    strokeSegment(canvas, p, p, paint, 14, false)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!painting.current) return
    const canvas = canvasRef.current!
    const p = canvasPoint(e, canvas)
    strokeSegment(canvas, last.current, p, paint, 14, false)
    last.current = p
  }

  const onPointerEnd = () => {
    if (!painting.current) return
    painting.current = false
    const canvas = canvasRef.current
    if (canvas) saveString(canvasKey(pageIdx), canvas.toDataURL())
  }

  const resetPage = () => {
    const canvas = canvasRef.current
    if (canvas) clearCanvas(canvas)
    saveString(canvasKey(pageIdx), null)
    const next = { ...fills, [pageIdx]: {} }
    setFills(next)
    saveJSON(FILLS_KEY, next)
  }

  return (
    <main data-screen-label="Coloring Pages">
      <h2 className="screen-title">Coloring pages</h2>
      <p className="screen-subline" style={{ marginBottom: 16 }}>
        Pick a picture and a color. Tap a shape to fill it — or switch to the brush and paint free!
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {PAGES.map((p, i) => (
          <button
            key={p.label}
            className={'page-tab' + (pageIdx === i ? ' active' : '')}
            onClick={() => setPageIdx(i)}
          >
            {p.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className={'mode-toggle left' + (mode === 'fill' ? ' active' : '')} onClick={() => setMode('fill')}>
          Tap to fill
        </button>
        <button className={'mode-toggle right' + (mode === 'brush' ? ' active' : '')} onClick={() => setMode('brush')}>
          Brush
        </button>
        <button className="reset-btn" style={{ marginLeft: 8 }} onClick={resetPage}>
          Start over
        </button>
      </div>

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {COLORS.map((c) => (
          <button
            key={c.name}
            title={c.name}
            className={'swatch-circle' + (paint === c.hex ? ' selected' : '')}
            style={{ background: c.hex }}
            onClick={() => setPaint(c.hex)}
          />
        ))}
      </div>

      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 26,
          boxShadow: '0 8px 0 rgba(122,95,168,0.12)',
          overflow: 'hidden',
          aspectRatio: '3/2',
          maxWidth: 960,
        }}
      >
        <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {page.regions.map((r) => (
            <path
              key={r.id}
              d={r.d}
              fill={pageFills[r.id] ?? '#ffffff'}
              stroke="#5a4a68"
              strokeWidth={5}
              strokeLinejoin="round"
              style={{ cursor: 'pointer' }}
              onClick={() => fillRegion(r.id)}
            />
          ))}
        </svg>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerLeave={onPointerEnd}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            touchAction: 'none',
            pointerEvents: mode === 'brush' ? 'auto' : 'none',
          }}
        />
      </div>
    </main>
  )
}
