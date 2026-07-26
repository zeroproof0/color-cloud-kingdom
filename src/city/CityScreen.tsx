import { useEffect, useRef, useState } from 'react'
import { CHARACTERS, type CharacterSpec } from './characters'
import { BrickCityGame } from './game'
import { loadString, saveString } from '../lib/storage'

/** Simple blocky portrait for the character picker. */
function Portrait({ c }: { c: CharacterSpec }) {
  return (
    <svg width="84" height="104" viewBox="0 0 84 104">
      {/* legs */}
      <rect x="26" y="78" width="14" height="22" rx="3" fill={c.pants} />
      <rect x="44" y="78" width="14" height="22" rx="3" fill={c.pants} />
      {/* torso */}
      <rect x="20" y="48" width="44" height="32" rx="6" fill={c.shirt} />
      {/* arms */}
      <rect x="10" y="50" width="12" height="26" rx="5" fill={c.shirt} />
      <rect x="62" y="50" width="12" height="26" rx="5" fill={c.shirt} />
      <rect x="11" y="72" width="10" height="9" rx="4" fill={c.skin} />
      <rect x="63" y="72" width="10" height="9" rx="4" fill={c.skin} />
      {/* head */}
      <rect x="24" y="14" width="36" height="32" rx="8" fill={c.skin} />
      {/* hair */}
      <rect x="22" y="8" width="40" height="14" rx="6" fill={c.hair} />
      {c.hairstyle === 'spiky' && (
        <>
          <rect x="28" y="2" width="8" height="10" rx="2" fill={c.hair} />
          <rect x="40" y="0" width="8" height="10" rx="2" fill={c.hair} />
          <rect x="50" y="3" width="8" height="10" rx="2" fill={c.hair} />
        </>
      )}
      {c.hairstyle === 'ponytail' && <rect x="60" y="16" width="12" height="30" rx="6" fill={c.hair} />}
      {c.hairstyle === 'buns' && (
        <>
          <circle cx="20" cy="14" r="8" fill={c.hair} />
          <circle cx="64" cy="14" r="8" fill={c.hair} />
        </>
      )}
      {c.hairstyle === 'long' && (
        <>
          <rect x="16" y="14" width="10" height="34" rx="5" fill={c.hair} />
          <rect x="58" y="14" width="10" height="34" rx="5" fill={c.hair} />
        </>
      )}
      {/* face */}
      <circle cx="35" cy="30" r="2.6" fill="#3a3440" />
      <circle cx="49" cy="30" r="2.6" fill="#3a3440" />
      <path d="M 36 38 Q 42 43 48 38" stroke="#b3543f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DPadButton({
  dir, label, onPress, style,
}: {
  dir: 'up' | 'down' | 'left' | 'right'
  label: string
  onPress: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void
  style: React.CSSProperties
}) {
  return (
    <button
      style={{
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 14,
        border: 'none',
        background: 'rgba(255,255,255,0.85)',
        color: '#5a4a68',
        fontSize: 22,
        fontWeight: 800,
        cursor: 'pointer',
        touchAction: 'none',
        boxShadow: '0 3px 0 rgba(76,65,96,0.3)',
        ...style,
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onPress(dir, true)
      }}
      onPointerUp={() => onPress(dir, false)}
      onPointerCancel={() => onPress(dir, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

export default function CityScreen() {
  const [charId, setCharId] = useState<string | null>(() => loadString('city-character'))
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [place, setPlace] = useState<string | null>(null)
  const [view, setView] = useState<'third' | 'first'>('third')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<BrickCityGame | null>(null)

  const character = CHARACTERS.find((c) => c.id === charId) ?? null

  useEffect(() => {
    if (!playing || !character || !canvasRef.current) return
    const game = new BrickCityGame(canvasRef.current, character, {
      onMessage: setMessage,
      onPlace: setPlace,
    })
    gameRef.current = game
    setView('third') // every new game instance starts in bird's-eye
    if (import.meta.env.DEV) {
      ;(window as unknown as { __cityGame?: BrickCityGame }).__cityGame = game
    }
    return () => {
      game.dispose()
      gameRef.current = null
    }
  }, [playing, character])

  if (!playing) {
    return (
      <main data-screen-label="Brick City">
        <h2 className="screen-title">Brick City</h2>
        <p className="screen-subline">
          Pick your brick buddy, then explore the city — walk the streets, visit the shops, and
          step through any door to go inside!
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
            maxWidth: 720,
            marginBottom: 22,
          }}
        >
          {CHARACTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCharId(c.id)
                saveString('city-character', c.id)
              }}
              style={{
                background: '#fff',
                borderRadius: 22,
                padding: '18px 10px 12px',
                cursor: 'pointer',
                border: `4px solid ${charId === c.id ? '#7a5fa8' : '#fff'}`,
                boxShadow: '0 5px 0 rgba(122,95,168,0.14)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              <Portrait c={c} />
              <span className="display" style={{ fontWeight: 800, fontSize: 18, color: '#5c4a80' }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>
        <button className="cta primary" disabled={!character} style={{ opacity: character ? 1 : 0.5 }} onClick={() => setPlaying(true)}>
          {character ? `Explore as ${character.name}!` : 'Pick a character first'}
        </button>
      </main>
    )
  }

  return (
    <main data-screen-label="Brick City" style={{ paddingBottom: 30 }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 26,
          overflow: 'hidden',
          boxShadow: '0 8px 0 rgba(122,95,168,0.12)',
          border: '3px solid #e9e1f4',
          height: 'min(70vh, 640px)',
          background: '#bfe0f8',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

        {/* HUD: place + messages */}
        <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
          <div
            className="display"
            style={{
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 999,
              padding: '7px 16px',
              fontWeight: 800,
              fontSize: 15,
              color: '#5c4a80',
            }}
          >
            {place ?? 'Brick City'}
          </div>
        </div>
        {message && (
          <div
            className="display"
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fdf3e3',
              borderRadius: 16,
              padding: '10px 18px',
              fontWeight: 800,
              fontSize: 16,
              color: '#c07a2c',
              boxShadow: '0 4px 0 rgba(122,95,168,0.2)',
              animation: 'popIn 0.3s ease',
              pointerEvents: 'none',
              maxWidth: '70%',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        )}

        {/* touch D-pad */}
        <div style={{ position: 'absolute', bottom: 18, left: 18, width: 170, height: 170 }}>
          {gameRef.current !== undefined && (
            <>
              <DPadButton dir="up" label="▲" style={{ left: 59, top: 0 }} onPress={(d, p) => gameRef.current?.setKey(d, p)} />
              <DPadButton dir="left" label="◀" style={{ left: 0, top: 59 }} onPress={(d, p) => gameRef.current?.setKey(d, p)} />
              <DPadButton dir="right" label="▶" style={{ left: 118, top: 59 }} onPress={(d, p) => gameRef.current?.setKey(d, p)} />
              <DPadButton dir="down" label="▼" style={{ left: 59, top: 118 }} onPress={(d, p) => gameRef.current?.setKey(d, p)} />
            </>
          )}
        </div>

        {/* view toggle */}
        <button
          className="display"
          onClick={() => {
            const v = gameRef.current?.toggleView()
            if (v) setView(v)
          }}
          style={{
            position: 'absolute',
            bottom: 18,
            right: 14,
            border: 'none',
            cursor: 'pointer',
            background: view === 'first' ? '#7a5fa8' : 'rgba(255,255,255,0.9)',
            borderRadius: 999,
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: 14,
            color: view === 'first' ? '#fff' : '#7a5fa8',
            boxShadow: '0 3px 0 rgba(76,65,96,0.2)',
          }}
        >
          {view === 'first' ? '👁 First person' : "🐦 Bird's eye"}
        </button>

        {/* switch character */}
        <button
          className="display"
          onClick={() => setPlaying(false)}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            border: 'none',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 999,
            padding: '8px 16px',
            fontWeight: 800,
            fontSize: 14,
            color: '#7a5fa8',
            boxShadow: '0 3px 0 rgba(76,65,96,0.2)',
          }}
        >
          Switch character
        </button>
      </div>
      <p className="screen-subline" style={{ marginTop: 12 }}>
        {view === 'first'
          ? 'Turn with ◀ ▶ and walk with ▲ (▼ backs up). Walk into a door to go inside — step on the red mat to come back out.'
          : 'Walk with the arrow keys (or WASD), or use the arrow pad. Walk into a door to go inside — step on the red mat to come back out.'}
      </p>
    </main>
  )
}
