import { useState } from 'react'
import { MIX_INPUTS, MIX_TABLE, RECIPES } from '../data/palette'
import { BiscuitFace } from '../components/mascots'

const EMPTY_SLOT_BG = '#f7f3fc'

function findPaint(name: string) {
  return MIX_INPUTS.find((p) => p.name === name)!
}

export function MixScreen() {
  const [mixA, setMixA] = useState<string | null>(null)
  const [mixB, setMixB] = useState<string | null>(null)

  const result =
    mixA && mixB
      ? mixA === mixB
        ? { name: 'Still ' + mixA.toLowerCase() + '!', hex: findPaint(mixA).hex }
        : MIX_TABLE[[mixA, mixB].sort().join('+')]
      : null

  // Pick banner text color by how light the mixed color actually is.
  const isLight = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff) > 165
  }
  const lightResult = result && isLight(result.hex)

  const pickPaint = (name: string) => {
    if (!mixA) setMixA(name)
    else if (!mixB) setMixB(name)
    else {
      setMixA(name)
      setMixB(null)
    }
  }

  const slotStyle = (hex: string | null): React.CSSProperties => ({
    width: 110,
    height: 110,
    borderRadius: 36,
    background: hex ?? EMPTY_SLOT_BG,
    border: `5px dashed ${hex ? 'transparent' : '#ddd2ee'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 15,
    color: '#b0a4c4',
  })

  return (
    <main data-screen-label="Color Mixing">
      <h2 className="screen-title">Magic mixing pot</h2>
      <p className="screen-subline">Tap two paint blobs and see what new color they make together!</p>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        {MIX_INPUTS.map((paint) => {
          const selected = mixA === paint.name || mixB === paint.name
          return (
            <button
              key={paint.name}
              onClick={() => pickPaint(paint.name)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              <span
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: '50% 50% 50% 12px',
                  background: paint.hex,
                  border: `4px solid ${selected ? '#7a5fa8' : '#ffffff'}`,
                  boxShadow: 'inset -6px -8px 0 rgba(0,0,0,0.1), 0 4px 0 rgba(76,65,96,0.15)',
                  display: 'block',
                }}
              />
              <span className="display" style={{ fontWeight: 700, fontSize: 15, color: '#6a5a86' }}>
                {paint.name}
              </span>
            </button>
          )
        })}
      </div>

      <div
        className="card"
        style={{
          padding: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          flexWrap: 'wrap',
        }}
      >
        <div className="display" style={slotStyle(mixA ? findPaint(mixA).hex : null)}>
          {mixA ? '' : 'pick one'}
        </div>
        <div className="display" style={{ fontWeight: 800, fontSize: 44, color: '#7a5fa8' }}>+</div>
        <div className="display" style={slotStyle(mixB ? findPaint(mixB).hex : null)}>
          {mixB ? '' : 'pick one'}
        </div>
        <div className="display" style={{ fontWeight: 800, fontSize: 44, color: '#7a5fa8' }}>=</div>
        <div
          className="display"
          style={{
            width: 130,
            height: 130,
            borderRadius: 40,
            background: result ? result.hex : EMPTY_SLOT_BG,
            border: '5px solid #f0e8f8',
            boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 20,
            color: result ? (lightResult ? '#6a5a86' : '#ffffff') : '#c4b8d8',
            animation: result ? 'popIn 0.5s ease' : 'none',
          }}
        >
          {result ? result.name : '?'}
        </div>
      </div>

      {result && (
        <div className="success-banner" style={{ marginTop: 18 }}>
          <BiscuitFace />
          <div className="display" style={{ fontWeight: 700, fontSize: 18, color: '#c07a2c' }}>
            {mixA === mixB
              ? 'Mixing a color with itself keeps it the same. Try two different blobs!'
              : `${mixA} and ${mixB} make ${result.name.toLowerCase()}! Biscuit says: amazing mixing!`}
          </div>
          <button
            className="banner-btn"
            onClick={() => {
              setMixA(null)
              setMixB(null)
            }}
          >
            Mix again
          </button>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h3 className="display" style={{ fontWeight: 800, fontSize: 20, color: '#6a4f9e', margin: '0 0 12px' }}>
          Mixing recipes to remember
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {RECIPES.map((rc) => (
            <div
              key={rc.text}
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 0 rgba(122,95,168,0.1)',
              }}
            >
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: rc.a, display: 'inline-block' }} />
              <span style={{ fontWeight: 800, color: '#9a8bb0' }}>+</span>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: rc.b, display: 'inline-block' }} />
              <span style={{ fontWeight: 800, color: '#9a8bb0' }}>=</span>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: rc.c, display: 'inline-block' }} />
              <span className="display" style={{ fontWeight: 700, fontSize: 15, color: '#6a5a86', marginLeft: 4 }}>
                {rc.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
