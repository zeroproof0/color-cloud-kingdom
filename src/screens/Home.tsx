import { MerryFull, BiscuitFull } from '../components/mascots'
import type { Screen } from '../App'

const SECTION_CARDS: Array<{ title: string; desc: string; border: string; go: Screen }> = [
  {
    title: 'Learn & Spell',
    desc: 'Meet every color and tap the letters to spell its name.',
    border: '#f5c84c',
    go: 'learn',
  },
  {
    title: 'Magic Mixing',
    desc: 'Mix two paints together and discover brand-new colors.',
    border: '#6db56a',
    go: 'mix',
  },
  {
    title: 'Coloring Pages',
    desc: 'Fill in friendly pictures with taps or brush strokes.',
    border: '#5a8fd6',
    go: 'coloring',
  },
  {
    title: 'Free Draw',
    desc: 'A blank page just for you — draw and stamp stickers!',
    border: '#9a6fc4',
    go: 'draw',
  },
]

export function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <main style={{ padding: '20px 26px 60px' }}>
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '24px 0 36px',
        }}
      >
        <div style={{ flex: 1, minWidth: 300, maxWidth: 520 }}>
          <h1
            className="display"
            style={{
              fontWeight: 800,
              fontSize: 46,
              lineHeight: 1.1,
              margin: '0 0 14px',
              color: '#6a4f9e',
              textWrap: 'pretty',
            }}
          >
            Welcome to a world made of colors!
          </h1>
          <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.6, margin: '0 0 22px', color: '#7c6f93' }}>
            Merry the bear and Biscuit the beagle live up here in the clouds. They will teach you
            every color, show you how to spell them, mix magical new ones — and let you color and
            draw all you want.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="cta primary" onClick={() => onNavigate('learn')}>
              Start learning
            </button>
            <button className="cta secondary" onClick={() => onNavigate('draw')}>
              Start creating
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0,
            animation: 'floaty 4s ease-in-out infinite',
          }}
        >
          <MerryFull />
          <BiscuitFull />
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18 }}>
        {SECTION_CARDS.map((card) => (
          <div
            key={card.title}
            className="home-card"
            onClick={() => onNavigate(card.go)}
            style={{
              background: '#fff',
              borderRadius: 26,
              padding: 24,
              cursor: 'pointer',
              boxShadow: '0 6px 0 rgba(122,95,168,0.12)',
              border: `3px solid ${card.border}`,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 10px 0 rgba(122,95,168,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = '0 6px 0 rgba(122,95,168,0.12)'
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: card.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', opacity: 0.9 }} />
            </div>
            <div className="display" style={{ fontWeight: 800, fontSize: 21, color: '#5c4a80', marginBottom: 6 }}>
              {card.title}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#8a7ba0', lineHeight: 1.5 }}>{card.desc}</div>
          </div>
        ))}
      </section>
    </main>
  )
}
