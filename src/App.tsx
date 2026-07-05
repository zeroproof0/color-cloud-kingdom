import { useState } from 'react'
import { Header } from './components/Header'
import { HiddenFriends } from './components/HiddenFriends'
import { HomeScreen } from './screens/Home'
import { LearnScreen } from './screens/Learn'
import { MixScreen } from './screens/Mix'
import { ColoringScreen } from './screens/Coloring'
import { DrawScreen } from './screens/Draw'

export type Screen = 'home' | 'learn' | 'mix' | 'coloring' | 'draw'

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
      {CONFIG.showHiddenFriends && <HiddenFriends screen={screen} />}
    </div>
  )
}
