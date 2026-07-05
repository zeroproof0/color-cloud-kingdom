import { useMemo, useState } from 'react'
import { COLORS, CONFETTI_COLORS } from '../data/palette'
import { MerryFace } from '../components/mascots'
import { CONFIG } from '../App'

interface BankLetter {
  ch: string
  originalIndex: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeBank(word: string): BankLetter[] {
  return shuffle(word.split('').map((ch, originalIndex) => ({ ch, originalIndex })))
}

// Deterministic confetti layout, matching the prototype's formula.
const CONFETTI_PIECES = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 8 + (i % 4) * 4,
  round: i % 2 ? '50%' : '3px',
  bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  dur: 1.4 + (i % 5) * 0.3,
  delay: (i % 7) * 0.12,
}))

export function LearnScreen() {
  const [learnIdx, setLearnIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [usedBank, setUsedBank] = useState<number[]>([])
  const [bankKey, setBankKey] = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)

  const color = COLORS[learnIdx]
  const word = color.name
  const upper = CONFIG.spellingUppercase
  const dispWord = upper ? word.toUpperCase() : word
  // Reshuffles whenever the color changes or progress resets (bankKey bump).
  const bank = useMemo(() => makeBank(word), [word, bankKey])
  const spellDone = progress >= word.length
  const lightWord = word === 'white' || word === 'yellow'

  const pickColor = (i: number) => {
    setLearnIdx(i)
    setProgress(0)
    setUsedBank([])
    setBankKey((k) => k + 1)
    setWrongFlash(false)
  }

  const tapLetter = (bankIdx: number) => {
    if (usedBank.includes(bankIdx) || spellDone) return
    if (bank[bankIdx].ch === word[progress]) {
      setProgress(progress + 1)
      setUsedBank([...usedBank, bankIdx])
      setWrongFlash(false)
    } else {
      setWrongFlash(false)
      // restart the shake even if one is already running
      requestAnimationFrame(() => setWrongFlash(true))
      setTimeout(() => setWrongFlash(false), 500)
    }
  }

  return (
    <main data-screen-label="Learn and Spell">
      <h2 className="screen-title">Learn your colors</h2>
      <p className="screen-subline">Pick a color, then tap the letters in order to spell its name!</p>

      <div className="chip-row" style={{ marginBottom: 26 }}>
        {COLORS.map((c, i) => (
          <button
            key={c.name}
            title={c.name}
            className={'swatch-square' + (i === learnIdx ? ' selected' : '')}
            style={{ background: c.hex }}
            onClick={() => pickColor(i)}
          />
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: 34,
              background: color.hex,
              border: '5px solid #f0e8f8',
              boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.08)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 18,
                animation: wrongFlash ? 'shakeNo 0.4s ease' : 'none',
              }}
            >
              {dispWord.split('').map((ch, i) => (
                <div
                  key={i}
                  className="display"
                  style={{
                    width: 54,
                    height: 62,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 32,
                    background: i < progress ? color.hex : '#f3eefa',
                    color: lightWord ? '#6a5a86' : '#ffffff',
                    borderBottom: `5px solid ${i === progress ? '#7a5fa8' : '#ddd2ee'}`,
                  }}
                >
                  {i < progress ? ch : ''}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {bank.map((b, idx) => {
                const used = usedBank.includes(idx)
                return (
                  <button
                    key={idx}
                    className="display"
                    disabled={used}
                    onClick={() => tapLetter(idx)}
                    style={{
                      width: 50,
                      height: 56,
                      borderRadius: 14,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: 28,
                      background: used ? '#e8e2f2' : '#fff',
                      color: '#6a5a86',
                      boxShadow: '0 4px 0 rgba(76,65,96,0.18)',
                      opacity: used ? 0.25 : 1,
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!used) e.currentTarget.style.transform = 'translateY(-3px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = ''
                    }}
                  >
                    {upper ? b.ch.toUpperCase() : b.ch}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {spellDone && (
          <div className="success-banner" style={{ marginTop: 22 }}>
            <MerryFace />
            <div className="display" style={{ fontWeight: 800, fontSize: 22, color: '#c07a2c' }}>
              Hooray! You spelled {dispWord}! Merry is so proud!
            </div>
            <button className="banner-btn" onClick={() => pickColor((learnIdx + 1) % COLORS.length)}>
              Next color
            </button>
          </div>
        )}

        {spellDone && CONFIG.confettiCelebrations && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              borderRadius: 30,
            }}
          >
            {CONFETTI_PIECES.map((p, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.round,
                  background: p.bg,
                  animation: `confettiFall ${p.dur}s ease-in ${p.delay}s forwards`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
