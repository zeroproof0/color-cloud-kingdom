/** All artwork is inline SVG per the design handoff — no external image assets. */

export function CloudLogo() {
  return (
    <svg width="52" height="40" viewBox="0 0 100 76">
      <ellipse cx="34" cy="52" rx="24" ry="17" fill="#ffffff" />
      <ellipse cx="62" cy="50" rx="26" ry="19" fill="#ffffff" />
      <ellipse cx="48" cy="40" rx="20" ry="16" fill="#ffffff" />
      <circle cx="30" cy="30" r="7" fill="#e4544f" />
      <circle cx="48" cy="22" r="7" fill="#f5c84c" />
      <circle cx="66" cy="30" r="7" fill="#5a8fd6" />
    </svg>
  )
}

/** Merry the bear — full body, for the home hero. */
export function MerryFull() {
  return (
    <svg width="220" height="240" viewBox="0 0 200 220">
      <circle cx="62" cy="42" r="20" fill="#f2a0bd" />
      <circle cx="138" cy="42" r="20" fill="#f2a0bd" />
      <circle cx="62" cy="42" r="10" fill="#fbd0df" />
      <circle cx="138" cy="42" r="10" fill="#fbd0df" />
      <circle cx="100" cy="78" r="52" fill="#f2a0bd" />
      <ellipse cx="100" cy="96" rx="24" ry="18" fill="#fbe3ec" />
      <circle cx="80" cy="70" r="6" fill="#4c4160" />
      <circle cx="120" cy="70" r="6" fill="#4c4160" />
      <circle cx="82" cy="68" r="2" fill="#fff" />
      <circle cx="122" cy="68" r="2" fill="#fff" />
      <ellipse cx="100" cy="90" rx="8" ry="6" fill="#4c4160" />
      <path d="M 90 102 Q 100 112 110 102" stroke="#4c4160" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="168" rx="46" ry="44" fill="#f2a0bd" />
      <circle cx="100" cy="164" r="27" fill="#fbe3ec" />
      <path d="M 82 172 A 18 18 0 0 1 118 172" stroke="#e4544f" strokeWidth="5" fill="none" />
      <path d="M 87 172 A 13 13 0 0 1 113 172" stroke="#f5c84c" strokeWidth="5" fill="none" />
      <path d="M 92 172 A 8 8 0 0 1 108 172" stroke="#5a8fd6" strokeWidth="5" fill="none" />
      <circle cx="46" cy="150" r="15" fill="#f2a0bd" />
      <circle cx="154" cy="150" r="15" fill="#f2a0bd" />
      <ellipse cx="74" cy="208" rx="17" ry="12" fill="#f2a0bd" />
      <ellipse cx="126" cy="208" rx="17" ry="12" fill="#f2a0bd" />
    </svg>
  )
}

/** Biscuit the beagle — full body, for the home hero. */
export function BiscuitFull() {
  return (
    <svg width="170" height="180" viewBox="0 0 180 190" style={{ marginLeft: -30 }}>
      <ellipse cx="52" cy="70" rx="16" ry="34" fill="#a4715a" />
      <ellipse cx="128" cy="70" rx="16" ry="34" fill="#a4715a" />
      <circle cx="90" cy="62" r="42" fill="#f7ecd9" />
      <circle cx="104" cy="52" r="15" fill="#a4715a" />
      <circle cx="76" cy="54" r="6" fill="#4c4160" />
      <circle cx="104" cy="54" r="6" fill="#4c4160" />
      <circle cx="78" cy="52" r="2" fill="#fff" />
      <circle cx="106" cy="52" r="2" fill="#fff" />
      <ellipse cx="90" cy="76" rx="9" ry="7" fill="#4c4160" />
      <path d="M 82 88 Q 90 95 98 88" stroke="#4c4160" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="90" cy="146" rx="46" ry="40" fill="#f7ecd9" />
      <ellipse cx="90" cy="152" rx="28" ry="24" fill="#fffaf0" />
      <circle cx="50" cy="132" r="13" fill="#a4715a" />
      <circle cx="130" cy="132" r="13" fill="#a4715a" />
      <ellipse cx="68" cy="180" rx="15" ry="10" fill="#a4715a" />
      <ellipse cx="112" cy="180" rx="15" ry="10" fill="#a4715a" />
    </svg>
  )
}

/** Merry's face — success banner on the Learn screen. */
export function MerryFace({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 220">
      <circle cx="62" cy="42" r="20" fill="#f2a0bd" />
      <circle cx="138" cy="42" r="20" fill="#f2a0bd" />
      <circle cx="100" cy="78" r="52" fill="#f2a0bd" />
      <ellipse cx="100" cy="96" rx="24" ry="18" fill="#fbe3ec" />
      <circle cx="80" cy="70" r="6" fill="#4c4160" />
      <circle cx="120" cy="70" r="6" fill="#4c4160" />
      <ellipse cx="100" cy="90" rx="8" ry="6" fill="#4c4160" />
      <path d="M 88 102 Q 100 114 112 102" stroke="#4c4160" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Biscuit's face — result banner on the Mixing screen. */
export function BiscuitFace({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 190">
      <ellipse cx="52" cy="70" rx="16" ry="34" fill="#a4715a" />
      <ellipse cx="128" cy="70" rx="16" ry="34" fill="#a4715a" />
      <circle cx="90" cy="62" r="42" fill="#f7ecd9" />
      <circle cx="104" cy="52" r="15" fill="#a4715a" />
      <circle cx="76" cy="54" r="6" fill="#4c4160" />
      <circle cx="104" cy="54" r="6" fill="#4c4160" />
      <ellipse cx="90" cy="76" rx="9" ry="7" fill="#4c4160" />
      <path d="M 82 88 Q 90 95 98 88" stroke="#4c4160" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Merry peeking over the bottom page edge. */
export function MerryPeek() {
  return (
    <svg width="90" height="70" viewBox="0 0 200 150">
      <circle cx="62" cy="52" r="20" fill="#f2a0bd" />
      <circle cx="138" cy="52" r="20" fill="#f2a0bd" />
      <circle cx="62" cy="52" r="10" fill="#fbd0df" />
      <circle cx="138" cy="52" r="10" fill="#fbd0df" />
      <circle cx="100" cy="92" r="52" fill="#f2a0bd" />
      <ellipse cx="100" cy="110" rx="24" ry="18" fill="#fbe3ec" />
      <circle cx="80" cy="84" r="6" fill="#4c4160" />
      <circle cx="120" cy="84" r="6" fill="#4c4160" />
      <ellipse cx="100" cy="104" rx="8" ry="6" fill="#4c4160" />
      <path d="M 88 118 Q 100 128 112 118" stroke="#4c4160" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Biscuit peeking over the bottom page edge. */
export function BiscuitPeek() {
  return (
    <svg width="84" height="64" viewBox="0 0 180 140">
      <ellipse cx="52" cy="80" rx="16" ry="34" fill="#a4715a" />
      <ellipse cx="128" cy="80" rx="16" ry="34" fill="#a4715a" />
      <circle cx="90" cy="72" r="42" fill="#f7ecd9" />
      <circle cx="104" cy="62" r="15" fill="#a4715a" />
      <circle cx="76" cy="64" r="6" fill="#4c4160" />
      <circle cx="104" cy="64" r="6" fill="#4c4160" />
      <ellipse cx="90" cy="86" rx="9" ry="7" fill="#4c4160" />
      <path d="M 82 98 Q 90 105 98 98" stroke="#4c4160" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}
