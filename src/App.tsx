import { lazy, Suspense, useState } from 'react'
import { Header } from './components/Header'
import { HiddenFriends } from './components/HiddenFriends'
import { HomeScreen } from './screens/Home'
import { LearnScreen } from './screens/Learn'
import { MixScreen } from './screens/Mix'
import { ColoringScreen } from './screens/Coloring'
import { DrawScreen } from './screens/Draw'

// The 3D engine is heavy — load it only when someone opens Brick City.
const CityScreen = lazy(() => import('./city/CityScreen'))

export type Screen = 'home' | 'learn' | 'mix' | 'coloring' | 'draw' | 'city'

// Feature toggles from the design handoff.
export const CONFIG = {
  showHiddenFriends: true,
  confettiCelebrations: true,
  spellingUppercase: true,
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home')

  return (
    <div className="app">
      <Header screen={screen} onNavigate={setScreen} />
      {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
      {screen === 'learn' && <LearnScreen />}
      {screen === 'mix' && <MixScreen />}
      {screen === 'coloring' && <ColoringScreen />}
      {screen === 'draw' && <DrawScreen />}
      {screen === 'city' && (
        <Suspense
          fallback={
            <main className="display" style={{ fontWeight: 800, fontSize: 22, color: '#6a4f9e' }}>
              Building Brick City…
            </main>
          }
        >
          <CityScreen />
        </Suspense>
      )}
      {CONFIG.showHiddenFriends && <HiddenFriends screen={screen} />}
    </div>
  )
}
