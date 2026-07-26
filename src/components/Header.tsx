import { CloudLogo } from './mascots'
import type { Screen } from '../App'

const TABS: Array<{ id: Screen; label: string; dot: string }> = [
  { id: 'home', label: 'Home', dot: '#f2a0bd' },
  { id: 'learn', label: 'Learn & Spell', dot: '#f5c84c' },
  { id: 'mix', label: 'Mixing', dot: '#6db56a' },
  { id: 'coloring', label: 'Coloring', dot: '#5a8fd6' },
  { id: 'draw', label: 'Free Draw', dot: '#9a6fc4' },
  { id: 'city', label: 'Brick City', dot: '#e4544f' },
]

export function Header({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 26px',
        flexWrap: 'wrap',
      }}
    >
      <div
        onClick={() => onNavigate('home')}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <CloudLogo />
        <div>
          <div className="display" style={{ fontWeight: 800, fontSize: 24, lineHeight: 1, color: '#7a5fa8' }}>
            Color Cloud Kingdom
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9a8bb0' }}>
            learn colors · make art · find friends
          </div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={'pill' + (screen === tab.id ? ' active' : '')}
            onClick={() => onNavigate(tab.id)}
          >
            <span className="pill-dot" style={{ background: tab.dot }} />
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
