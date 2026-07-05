import { useEffect, useState } from 'react'
import { MerryPeek, BiscuitPeek } from './mascots'
import type { Screen } from '../App'

/**
 * Merry peeks bottom-right on Learn & Coloring; Biscuit peeks bottom-left on
 * Mixing & Free Draw. Found state resets on navigation so they can be found again.
 */
export function HiddenFriends({ screen }: { screen: Screen }) {
  const [bearFound, setBearFound] = useState(false)
  const [pupFound, setPupFound] = useState(false)

  useEffect(() => {
    setBearFound(false)
    setPupFound(false)
  }, [screen])

  const showBear = screen === 'learn' || screen === 'coloring'
  const showPup = screen === 'mix' || screen === 'draw'

  return (
    <>
      {showBear && (
        <div
          onClick={() => setBearFound(true)}
          title="Who is hiding here?"
          style={{
            position: 'fixed',
            bottom: -14,
            right: 30,
            cursor: 'pointer',
            animation: 'wigglepeek 3s ease-in-out infinite',
            transformOrigin: 'bottom center',
            zIndex: 50,
          }}
        >
          {bearFound && (
            <div
              className="display"
              style={{
                position: 'absolute',
                top: -46,
                right: 0,
                background: '#fff',
                borderRadius: 16,
                padding: '8px 14px',
                fontWeight: 800,
                fontSize: 14,
                color: '#7a5fa8',
                boxShadow: '0 4px 0 rgba(122,95,168,0.2)',
                whiteSpace: 'nowrap',
                animation: 'popIn 0.3s ease',
              }}
            >
              You found Merry! ♥
            </div>
          )}
          <MerryPeek />
        </div>
      )}
      {showPup && (
        <div
          onClick={() => setPupFound(true)}
          title="Who is hiding here?"
          style={{
            position: 'fixed',
            bottom: -12,
            left: 26,
            cursor: 'pointer',
            animation: 'wigglepeek 3.6s ease-in-out infinite',
            transformOrigin: 'bottom center',
            zIndex: 50,
          }}
        >
          {pupFound && (
            <div
              className="display"
              style={{
                position: 'absolute',
                top: -46,
                left: 0,
                background: '#fff',
                borderRadius: 16,
                padding: '8px 14px',
                fontWeight: 800,
                fontSize: 14,
                color: '#a4715a',
                boxShadow: '0 4px 0 rgba(122,95,168,0.2)',
                whiteSpace: 'nowrap',
                animation: 'popIn 0.3s ease',
              }}
            >
              You found Biscuit! Woof!
            </div>
          )}
          <BiscuitPeek />
        </div>
      )}
    </>
  )
}
