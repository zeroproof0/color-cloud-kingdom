import { useEffect, useRef, useState } from 'react'
import { COLORS } from '../data/palette'
import {
  CANVAS_W,
  CANVAS_H,
  canvasPoint,
  strokeSegment,
  clearCanvas,
  restoreCanvas,
  stampSticker,
  type Point,
  type StickerKind,
} from '../lib/canvas'
import { loadString, saveString } from '../lib/storage'

type Tool = 'brush' | 'eraser' | `sticker:${StickerKind}`

const DRAW_KEY = 'draw-canvas'
const BRUSH_SIZES = [5, 10, 20]

const STICKERS: Array<{ kind: StickerKind; title: string; icon: React.ReactNode }> = [
  {
    kind: 'heart',
    title: 'Heart sticker',
    icon: (
      <svg width="30" height="30" viewBox="0 0 100 100">
        <path
          d="M 50 86 C 20 62 8 44 16 28 C 24 12 44 14 50 30 C 56 14 76 12 84 28 C 92 44 80 62 50 86 Z"
          fill="#e4544f"
        />
      </svg>
    ),
  },
  {
    kind: 'star',
    title: 'Star sticker',
    icon: (
      <svg width="30" height="30" viewBox="0 0 100 100">
        <path
          d="M 50 6 L 61 38 L 95 38 L 68 58 L 78 92 L 50 71 L 22 92 L 32 58 L 5 38 L 39 38 Z"
          fill="#f5c84c"
        />
      </svg>
    ),
  },
  {
    kind: 'rainbow',
    title: 'Rainbow sticker',
    icon: (
      <svg width="32" height="22" viewBox="0 0 100 60">
        <path d="M 10 56 A 40 40 0 0 1 90 56" stroke="#e4544f" strokeWidth="8" fill="none" />
        <path d="M 22 56 A 28 28 0 0 1 78 56" stroke="#f5c84c" strokeWidth="8" fill="none" />
        <path d="M 34 56 A 16 16 0 0 1 66 56" stroke="#5a8fd6" strokeWidth="8" fill="none" />
      </svg>
    ),
  },
  {
    kind: 'cloud',
    title: 'Cloud sticker',
    icon: (
      <svg width="32" height="22" viewBox="0 0 100 66">
        <ellipse cx="34" cy="44" rx="24" ry="17" fill="#c7ddf5" />
        <ellipse cx="64" cy="42" rx="26" ry="19" fill="#c7ddf5" />
        <ellipse cx="48" cy="30" rx="20" ry="16" fill="#c7ddf5" />
      </svg>
    ),
  },
  {
    kind: 'bear',
    title: 'Bear sticker',
    icon: (
      <svg width="30" height="30" viewBox="0 0 100 100">
        <circle cx="28" cy="24" r="13" fill="#f2a0bd" />
        <circle cx="72" cy="24" r="13" fill="#f2a0bd" />
        <circle cx="50" cy="52" r="32" fill="#f2a0bd" />
        <ellipse cx="50" cy="62" rx="15" ry="11" fill="#fbe3ec" />
        <circle cx="38" cy="46" r="4" fill="#4c4160" />
        <circle cx="62" cy="46" r="4" fill="#4c4160" />
        <ellipse cx="50" cy="58" rx="5" ry="4" fill="#4c4160" />
      </svg>
    ),
  },
  {
    kind: 'pup',
    title: 'Puppy sticker',
    icon: (
      <svg width="30" height="30" viewBox="0 0 100 100">
        <ellipse cx="24" cy="46" rx="10" ry="22" fill="#a4715a" />
        <ellipse cx="76" cy="46" rx="10" ry="22" fill="#a4715a" />
        <circle cx="50" cy="48" r="28" fill="#f7ecd9" />
        <circle cx="60" cy="40" r="10" fill="#a4715a" />
        <circle cx="41" cy="42" r="4" fill="#4c4160" />
        <circle cx="60" cy="42" r="4" fill="#4c4160" />
        <ellipse cx="50" cy="57" rx="6" ry="5" fill="#4c4160" />
      </svg>
    ),
  },
]

export function DrawScreen() {
  const [drawColor, setDrawColor] = useState('#e4544f')
  const [brushSize, setBrushSize] = useState(10)
  const [tool, setTool] = useState<Tool>('brush')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painting = useRef(false)
  const last = useRef<Point>({ x: 0, y: 0 })

  // Restore the saved drawing on mount so work survives navigation and reloads.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const saved = loadString(DRAW_KEY)
    if (saved) restoreCanvas(canvas, saved)
  }, [])

  const save = () => {
    const canvas = canvasRef.current
    if (canvas) saveString(DRAW_KEY, canvas.toDataURL())
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const p = canvasPoint(e, canvas)
    if (tool.startsWith('sticker:')) {
      stampSticker(canvas, tool.slice(8) as StickerKind, p)
      save()
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    painting.current = true
    last.current = p
    strokeSegment(canvas, p, p, drawColor, brushSize, tool === 'eraser')
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!painting.current) return
    const canvas = canvasRef.current!
    const p = canvasPoint(e, canvas)
    strokeSegment(canvas, last.current, p, drawColor, brushSize, tool === 'eraser')
    last.current = p
  }

  const onPointerEnd = () => {
    if (!painting.current) return
    painting.current = false
    save()
  }

  const clearAll = () => {
    const canvas = canvasRef.current
    if (canvas) clearCanvas(canvas)
    saveString(DRAW_KEY, null)
  }

  return (
    <main data-screen-label="Free Draw">
      <h2 className="screen-title">Free draw &amp; stickers</h2>
      <p className="screen-subline" style={{ marginBottom: 16 }}>
        Draw anything you dream up! Pick a sticker and tap the page to stamp it.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {COLORS.map((c) => (
          <button
            key={c.name}
            title={c.name}
            className={'swatch-circle' + (tool === 'brush' && drawColor === c.hex ? ' selected' : '')}
            style={{ background: c.hex }}
            onClick={() => {
              setDrawColor(c.hex)
              setTool('brush')
            }}
          />
        ))}
        <span style={{ width: 2, height: 36, background: '#e4dcf0', borderRadius: 2, margin: '0 4px' }} />
        {BRUSH_SIZES.map((n) => (
          <button
            key={n}
            onClick={() => {
              setBrushSize(n)
              setTool('brush')
            }}
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              border: `3px solid ${brushSize === n && tool === 'brush' ? '#7a5fa8' : '#e9e1f4'}`,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ width: n, height: n, borderRadius: '50%', background: '#5a4a68', display: 'inline-block' }} />
          </button>
        ))}
        <button
          className="display"
          onClick={() => setTool('eraser')}
          style={{
            fontWeight: 800,
            fontSize: 15,
            border: `3px solid ${tool === 'eraser' ? '#7a5fa8' : '#e9e1f4'}`,
            cursor: 'pointer',
            padding: '9px 16px',
            borderRadius: 14,
            background: '#fff',
            color: '#6a5a86',
          }}
        >
          Eraser
        </button>
        <span style={{ flex: 1 }} />
        <button className="reset-btn" onClick={clearAll}>
          Clear page
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <span className="display" style={{ fontWeight: 800, fontSize: 15, color: '#6a4f9e', marginRight: 4 }}>
          Stickers:
        </span>
        {STICKERS.map((s) => (
          <button
            key={s.kind}
            title={s.title}
            onClick={() => setTool(`sticker:${s.kind}`)}
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              border: `3px solid ${tool === `sticker:${s.kind}` ? '#7a5fa8' : '#e9e1f4'}`,
              background: '#fff',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
          >
            {s.icon}
          </button>
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
          border: '3px solid #e9e1f4',
        }}
      >
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
            cursor: 'crosshair',
          }}
        />
      </div>
    </main>
  )
}
