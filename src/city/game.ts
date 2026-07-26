import * as THREE from 'three'
import type { CharacterSpec } from './characters'

/**
 * Brick City — a chunky brick-built town rendered with three.js.
 *
 * World layout (200×200 ground, +x = east, +z = south):
 * - Central east–west street at z=0 with two rows of 7 houses facing it.
 * - Ring road at |x|=70 / |z|=70 with the public venues on the outside.
 * - Football field and animal sanctuary are open outdoor zones; every other
 *   venue (and every house) has a walk-in interior behind its door.
 */

export interface GameCallbacks {
  /** Transient toast, e.g. "Welcome to the Hospital!" (null clears it) */
  onMessage(text: string | null): void
  /** Name of the interior the player is in (null = outside) */
  onPlace(name: string | null): void
}

interface Collider {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface DoorTrigger {
  x: number
  z: number
  building: BuildingCfg
}

interface ZoneTrigger {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  message: string
  active: boolean
}

type VenueType =
  | 'house'
  | 'hospital'
  | 'clothing'
  | 'preschool'
  | 'highschool'
  | 'accessory'
  | 'fashion'
  | 'community'

interface BuildingCfg {
  type: VenueType
  name: string
  color: string
  w: number
  d: number
  h: number
  x: number
  z: number
  /** rotation around Y; door faces local +z before rotation */
  rot: number
}

const HOUSE_COLORS = [
  '#e4544f', '#5a8fd6', '#f5c84c', '#6db56a', '#f2a0bd', '#9a6fc4', '#f28c3b',
  '#4a9a94', '#c05a9e', '#a4715a', '#8f9ede', '#b4cc5a', '#ec7086', '#c9aede',
]

const PLAYER_RADIUS = 1.1
const PLAYER_SPEED = 16
const BOUND_X = 170
const BOUND_Z = 140

// the lake occupies the whole east side of the expanded map
const LAKE = { minX: 105, maxX: 170, minZ: -30, maxZ: 130 }
const DOCK_END = { x: 113.5, z: 20 }
const BOAT_PARK = { x: 118, z: 26 }
const LAKE_OBSTACLES = [
  { x: 140, z: 55, r: 14 }, // treasure island
  { x: 152, z: -5, r: 6 }, // fountain
  { x: 135, z: -15, r: 5.5 }, // anchored sailboats
  { x: 120, z: 100, r: 5.5 },
  // buoys
  { x: 128, z: 10, r: 2 },
  { x: 160, z: 40, r: 2 },
  { x: 118, z: 55, r: 2 },
  { x: 163, z: 75, r: 2 },
  // floating logs
  { x: 112, z: 115, r: 2.6 },
  { x: 158, z: 15, r: 2.6 },
  { x: 130, z: -22, r: 2.6 },
]

const JUMP_RAMPS = [
  { x: 150, z: 82 },
  { x: 115, z: -8 },
  { x: 158, z: 112 },
]

const MONSTER = { x: 138, z: 93, r: 11 }

const FLOOR_NAMES = ['Singing Stage', 'Recording Studio', 'Gaming Room', 'Slide Floor', 'Rooftop Garden']

const V_UP = new THREE.Vector3(0, 1, 0)

function mat(color: string) {
  return new THREE.MeshLambertMaterial({ color })
}

function box(
  w: number, h: number, d: number, color: string,
  x: number, y: number, z: number, parent: THREE.Object3D,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color))
  m.position.set(x, y, z)
  parent.add(m)
  return m
}

function cylinder(
  rTop: number, rBot: number, h: number, color: string,
  x: number, y: number, z: number, parent: THREE.Object3D, radialSegments = 12,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, radialSegments), mat(color))
  m.position.set(x, y, z)
  parent.add(m)
  return m
}

/** Floating text label rendered onto a sprite. */
function textSprite(text: string, parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  const r = 28
  ctx.beginPath()
  ctx.roundRect(6, 18, 500, 92, r)
  ctx.fill()
  ctx.fillStyle = '#5a4a68'
  ctx.font = '700 44px "Baloo 2", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 66)
  const tex = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }))
  sprite.scale.set(16 * scale, 4 * scale, 1)
  sprite.position.set(x, y, z)
  parent.add(sprite)
}

export class BrickCityGame {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private cityGroup = new THREE.Group()
  private interiorGroup: THREE.Group | null = null
  private player!: THREE.Group
  private limbs: { armL: THREE.Object3D; armR: THREE.Object3D; legL: THREE.Object3D; legR: THREE.Object3D } | null = null

  private keys = { up: false, down: false, left: false, right: false }
  private colliders: Collider[] = []
  private interiorColliders: Collider[] = []
  private doors: DoorTrigger[] = []
  private zones: ZoneTrigger[] = []
  private studPositions: THREE.Vector3[] = []

  private mode: 'city' | 'interior' | 'boat' = 'city'
  private view: 'third' | 'first' = 'third'
  private enteredType: VenueType = 'house'
  private curClampD = 0
  private exitRot = 0
  private t = 0

  // lake life
  private boatGroup!: THREE.Group
  private boatRot = Math.PI / 2
  private leftDock = false
  private lakeZones: ZoneTrigger[] = []
  private ducks: THREE.Group[] = []
  private fountainJet: THREE.Mesh | null = null
  private anchored: THREE.Group[] = []
  private waveStrips: { mesh: THREE.Mesh; baseX: number; speed: number }[] = []
  private logs: THREE.Mesh[] = []
  private monsterSegs: THREE.Group[] = []
  private splashMesh: THREE.Mesh | null = null
  private splashAge = 99
  private airborne = false
  private vy = 0
  private jumpCooldown = 0
  private poolWater = { minX: -140, maxX: -110, minZ: 34, maxZ: 56 }

  // community center floors
  private floors: THREE.Group[] | null = null
  private floorColliders: Collider[][] = []
  private curFloor = 0
  private exitSpot = new THREE.Vector3()
  private interiorExit = new THREE.Vector3()
  private doorCooldown = 0
  private walkPhase = 0
  private raf = 0
  private lastT = 0
  private disposed = false
  private msgTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    spec: CharacterSpec,
    private cb: GameCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.5, 600)
    this.scene.background = new THREE.Color('#bfe0f8')
    this.scene.fog = new THREE.Fog('#bfe0f8', 140, 420)

    this.scene.add(new THREE.HemisphereLight('#ffffff', '#9db98a', 0.95))
    const sun = new THREE.DirectionalLight('#fff6e0', 1.1)
    sun.position.set(60, 100, 40)
    this.scene.add(sun)

    this.buildCity()
    this.player = this.buildCharacter(spec)
    this.player.position.set(0, 0, 8)
    this.scene.add(this.player)
    this.scene.add(this.cityGroup)

    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKey)
    this.resize()
    window.addEventListener('resize', this.resize)

    this.lastT = performance.now()
    this.loop(this.lastT)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKey)
    window.removeEventListener('resize', this.resize)
    if (this.msgTimer) clearTimeout(this.msgTimer)
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
      mats.forEach((mm) => {
        const sm = mm as THREE.SpriteMaterial
        if (sm.map) sm.map.dispose()
        mm.dispose()
      })
    })
    this.renderer.dispose()
  }

  /** Touch/on-screen controls call this alongside the keyboard handler. */
  setKey(key: 'up' | 'down' | 'left' | 'right', pressed: boolean) {
    this.keys[key] = pressed
  }

  /** Where the player is and whether they're inside — used by dev tooling. */
  debugState() {
    return {
      x: this.player.position.x,
      z: this.player.position.z,
      rot: this.player.rotation.y,
      view: this.view,
      mode: this.mode,
    }
  }

  /** Teleport helper for dev tooling (moves the boat instead while sailing). */
  debugTeleport(x: number, z: number) {
    if (this.mode === 'boat') this.boatGroup.position.set(x, 0.2, z)
    else this.player.position.set(x, 0, z)
  }

  /** Switch between the bird's-eye follow camera and first-person view. */
  toggleView(): 'third' | 'first' {
    this.view = this.view === 'third' ? 'first' : 'third'
    this.player.visible = this.view === 'third'
    return this.view
  }

  private onKey = (e: KeyboardEvent) => {
    const down = e.type === 'keydown'
    const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
    }
    const k = map[e.code]
    if (k) {
      this.keys[k] = down
      e.preventDefault()
    }
  }

  private resize = () => {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (w === 0 || h === 0) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private toast(text: string, ms = 2600) {
    this.cb.onMessage(text)
    if (this.msgTimer) clearTimeout(this.msgTimer)
    this.msgTimer = setTimeout(() => this.cb.onMessage(null), ms)
  }

  // ---------------- city construction ----------------

  private buildCity() {
    const g = this.cityGroup

    const ground = new THREE.Mesh(new THREE.BoxGeometry(360, 2, 300), mat('#7cbf6b'))
    ground.position.y = -1
    g.add(ground)

    // roads: central E–W street + ring road
    const road = (w: number, d: number, x: number, z: number) => {
      box(w, 0.2, d, '#5b5b64', x, 0.1, z, g)
      // dashed center line
      const horiz = w > d
      const len = horiz ? w : d
      for (let i = -len / 2 + 4; i < len / 2 - 2; i += 8) {
        box(horiz ? 3 : 0.6, 0.22, horiz ? 0.6 : 3, '#f5f1e6', horiz ? x + i : x, 0.12, horiz ? z : z + i, g)
      }
    }
    road(148, 8, 0, 0)
    road(148, 8, 0, -70)
    road(148, 8, 0, 70)
    road(8, 132, -70, 0)
    road(8, 132, 70, 0)
    road(34, 6, 87, 20) // spur to the lake dock
    road(60, 6, 100, -70) // spur to the community center

    // the 14 houses — two rows of 7 facing the central street
    const houseXs = [-60, -40, -20, 0, 20, 40, 60]
    houseXs.forEach((x, i) => {
      this.building({
        type: 'house', name: 'Cozy House', color: HOUSE_COLORS[i],
        w: 12, d: 10, h: 7, x, z: -20, rot: 0,
      })
      this.building({
        type: 'house', name: 'Cozy House', color: HOUSE_COLORS[i + 7],
        w: 12, d: 10, h: 7, x, z: 20, rot: Math.PI,
      })
    })

    // north venues (doors face south toward the ring road)
    this.building({ type: 'hospital', name: 'Hospital', color: '#f4f4f0', w: 24, d: 14, h: 12, x: -45, z: -84, rot: 0 })
    this.building({ type: 'preschool', name: 'Pre-School', color: '#f5c84c', w: 18, d: 12, h: 8, x: 0, z: -83, rot: 0 })
    this.building({ type: 'highschool', name: 'High School', color: '#f28c3b', w: 26, d: 14, h: 12, x: 48, z: -84, rot: 0 })
    // south venues (doors face north)
    this.building({ type: 'clothing', name: 'Clothing Shop', color: '#5a8fd6', w: 18, d: 12, h: 9, x: -48, z: 84, rot: Math.PI })
    this.building({ type: 'fashion', name: 'Fashion Store', color: '#c05a9e', w: 26, d: 16, h: 13, x: 0, z: 85, rot: Math.PI })
    this.building({ type: 'accessory', name: 'Accessory Store', color: '#f2a0bd', w: 16, d: 12, h: 8, x: 48, z: 84, rot: Math.PI })

    this.building({ type: 'community', name: 'Community Center', color: '#4a9a94', w: 30, d: 22, h: 27, x: 130, z: -75, rot: 0 })

    this.iceCreamCart(-84, 30)
    this.footballField(84, 0)
    this.animalSanctuary(-84, -28)
    this.bigSign(0, -48)
    this.tennisCourts(-125, -56)
    this.swimmingPool(-125, 45)
    this.lake()

    // trees on the grass
    const treeSpots = [
      [-30, -45], [30, -45], [-55, 45], [55, 45], [-30, 48], [30, 48],
      [-92, 60], [-55, -48], [55, -48], [0, 45], [-100, -100], [-150, -100],
      [-155, 0], [-100, 90], [-155, 90], [-60, 110], [0, 115], [60, 115], [40, -110], [-40, -110],
    ]
    for (const [x, z] of treeSpots) {
      cylinder(0.8, 1, 4, '#8a6a52', x, 2, z, g, 8)
      box(4, 4, 4, '#4e9a4e', x, 6, z, g)
      box(2.6, 2.6, 2.6, '#5fae5a', x, 8.6, z, g)
      this.colliders.push({ minX: x - 1.2, maxX: x + 1.2, minZ: z - 1.2, maxZ: z + 1.2 })
    }

    this.flushStuds(g)
  }

  /** Queue stud positions (the round bumps) to be drawn as one InstancedMesh. */
  private studs(cx: number, cz: number, topY: number, w: number, d: number, rot: number) {
    const nx = Math.max(1, Math.floor(w / 3))
    const nz = Math.max(1, Math.floor(d / 3))
    for (let ix = 0; ix < nx; ix++) {
      for (let iz = 0; iz < nz; iz++) {
        const lx = -w / 2 + (w / nx) * (ix + 0.5)
        const lz = -d / 2 + (d / nz) * (iz + 0.5)
        const x = cx + lx * Math.cos(rot) + lz * Math.sin(rot)
        const z = cz - lx * Math.sin(rot) + lz * Math.cos(rot)
        this.studPositions.push(new THREE.Vector3(x, topY, z))
      }
    }
  }

  private flushStuds(parent: THREE.Object3D) {
    if (!this.studPositions.length) return
    const geo = new THREE.CylinderGeometry(0.85, 0.85, 0.7, 14)
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 }), this.studPositions.length)
    const m4 = new THREE.Matrix4()
    this.studPositions.forEach((p, i) => {
      m4.makeTranslation(p.x, p.y + 0.35, p.z)
      inst.setMatrixAt(i, m4)
    })
    parent.add(inst)
    this.studPositions = []
  }

  private building(cfg: BuildingCfg) {
    const g = new THREE.Group()
    g.position.set(cfg.x, 0, cfg.z)
    g.rotation.y = cfg.rot
    const { w, d, h } = cfg

    box(w, h, d, cfg.color, 0, h / 2, 0, g)
    // flat brick roof rim
    box(w + 1.2, 1.2, d + 1.2, '#e9e4da', 0, h + 0.6, 0, g)
    // door (front = local +z)
    box(4, 5.4, 0.6, '#5a4236', 0, 2.7, d / 2 + 0.31, g)
    box(0.7, 0.7, 0.4, '#f5c84c', 1.2, 2.7, d / 2 + 0.62, g)
    // windows either side of the door
    const winY = h * 0.55
    box(3, 2.6, 0.4, '#cfe8f8', -w / 4, winY, d / 2 + 0.25, g)
    box(3, 2.6, 0.4, '#cfe8f8', w / 4, winY, d / 2 + 0.25, g)
    if (cfg.type === 'hospital') {
      // red cross above the door
      box(1.2, 3.6, 0.4, '#e4544f', 0, h - 2, d / 2 + 0.35, g)
      box(3.6, 1.2, 0.4, '#e4544f', 0, h - 2, d / 2 + 0.35, g)
    }
    if (cfg.type === 'community') {
      // one row of windows per upper floor
      for (let f = 1; f < 5; f++) {
        for (const wx of [-10, -3.5, 3.5, 10]) {
          box(3.4, 2.8, 0.4, '#cfe8f8', wx, f * 5.4 + 2.6, d / 2 + 0.25, g)
        }
      }
    }
    this.cityGroup.add(g)

    // roof studs, collider, door trigger, sign — in world space
    this.studs(cfg.x, cfg.z, cfg.rot === 0 || true ? h + 1.2 : h, w - 1, d - 1, cfg.rot)

    const cos = Math.cos(cfg.rot)
    const hw = (Math.abs(cos) > 0.5 ? w : d) / 2 + 0.6
    const hd = (Math.abs(cos) > 0.5 ? d : w) / 2 + 0.6
    this.colliders.push({ minX: cfg.x - hw, maxX: cfg.x + hw, minZ: cfg.z - hd, maxZ: cfg.z + hd })

    // door world position: local (0, d/2) rotated
    const dx = cfg.x + Math.sin(cfg.rot) * (d / 2 + 1.5)
    const dz = cfg.z + Math.cos(cfg.rot) * (d / 2 + 1.5)
    this.doors.push({ x: dx, z: dz, building: cfg })

    if (cfg.type !== 'house') {
      textSprite(cfg.name, this.cityGroup, cfg.x, h + 6, cfg.z, 1.15)
    }
  }

  private iceCreamCart(x: number, z: number) {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    box(6, 4, 3.6, '#f4f4f0', 0, 3.4, 0, g)
    box(6.4, 0.8, 4, '#e4544f', 0, 5.6, 0, g)
    cylinder(0.9, 0.9, 0.8, '#4a4a52', -1.8, 1, 2, g)
    cylinder(0.9, 0.9, 0.8, '#4a4a52', 1.8, 1, 2, g)
    cylinder(0.9, 0.9, 0.8, '#4a4a52', -1.8, 1, -2, g)
    cylinder(0.9, 0.9, 0.8, '#4a4a52', 1.8, 1, -2, g)
    cylinder(0.25, 0.25, 6, '#8a6a52', 2.4, 8, 0, g, 8)
    cylinder(0.2, 4.6, 2.4, '#f2a0bd', 2.4, 11.5, 0, g, 10)
    // giant cone on the cart
    cylinder(1, 0.2, 3, '#c99a52', -1.4, 7.4, 0, g, 10)
    const scoop = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), mat('#f2a0bd'))
    scoop.position.set(-1.4, 9.3, 0)
    g.add(scoop)
    this.cityGroup.add(g)
    textSprite('Ice Cream', this.cityGroup, x, 15, z)
    this.colliders.push({ minX: x - 3.5, maxX: x + 3.5, minZ: z - 2.4, maxZ: z + 2.4 })
    this.zones.push({
      minX: x - 9, maxX: x + 9, minZ: z - 9, maxZ: z + 9,
      message: '🍦 One scoop or two? Enjoy your ice cream!', active: false,
    })
  }

  private footballField(x: number, z: number) {
    const g = this.cityGroup
    box(24, 0.24, 44, '#4e9a4e', x, 0.12, z, g)
    // white lines
    box(24, 0.06, 1, '#ffffff', x, 0.28, z, g)
    for (const dz of [-21.5, 21.5]) box(24, 0.06, 1, '#ffffff', x, 0.28, z + dz, g)
    for (const dx of [-11.5, 11.5]) box(1, 0.06, 44, '#ffffff', x + dx, 0.28, z + dz0(), g)
    function dz0() { return 0 }
    // goals
    for (const end of [-1, 1]) {
      const gz = z + end * 20.5
      cylinder(0.3, 0.3, 5, '#f4f4f0', x - 5, 2.5, gz, g, 8)
      cylinder(0.3, 0.3, 5, '#f4f4f0', x + 5, 2.5, gz, g, 8)
      box(10.6, 0.5, 0.5, '#f4f4f0', x, 5, gz, g)
      this.colliders.push({ minX: x - 5.4, maxX: x - 4.6, minZ: gz - 0.4, maxZ: gz + 0.4 })
      this.colliders.push({ minX: x + 4.6, maxX: x + 5.4, minZ: gz - 0.4, maxZ: gz + 0.4 })
    }
    // football
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), mat('#f4f4f0'))
    ball.position.set(x + 3, 0.9, z + 4)
    this.cityGroup.add(ball)
    textSprite('Football Field', this.cityGroup, x, 12, z)
    this.zones.push({
      minX: x - 12, maxX: x + 12, minZ: z - 22, maxZ: z + 22,
      message: '⚽ Welcome to the football field! Run it out!', active: false,
    })
  }

  private animalSanctuary(x: number, z: number) {
    const g = this.cityGroup
    const w = 26, d = 22
    box(w, 0.22, d, '#9dc07a', x, 0.11, z, g)
    // fence with a gate gap on the east side
    const post = (px: number, pz: number) => cylinder(0.3, 0.3, 2.6, '#8a6a52', px, 1.3, pz, g, 6)
    for (let i = -w / 2; i <= w / 2; i += 4) post(x + i, z - d / 2), post(x + i, z + d / 2)
    for (let i = -d / 2 + 4; i <= d / 2 - 4; i += 4) post(x - w / 2, z + i)
    for (let i = -d / 2 + 4; i <= d / 2 - 4; i += 4) {
      if (Math.abs(i) > 4) post(x + w / 2, z + i) // gate gap at |i| <= 4
    }
    box(w, 0.4, 0.3, '#a4715a', x, 2.2, z - d / 2, g)
    box(w, 0.4, 0.3, '#a4715a', x, 2.2, z + d / 2, g)
    // rails with gate gap
    box(0.3, 0.4, d / 2 - 5, '#a4715a', x - w / 2, 2.2, z - d / 4 - 2.5, g)
    box(0.3, 0.4, d / 2 - 5, '#a4715a', x - w / 2, 2.2, z + d / 4 + 2.5, g)
    box(0.3, 0.4, d / 2 - 5, '#a4715a', x + w / 2, 2.2, z - d / 4 - 2.5, g)
    box(0.3, 0.4, d / 2 - 5, '#a4715a', x + w / 2, 2.2, z + d / 4 + 2.5, g)
    // fence colliders (thin walls, gate gap on east)
    this.colliders.push({ minX: x - w / 2 - 0.4, maxX: x + w / 2 + 0.4, minZ: z - d / 2 - 0.4, maxZ: z - d / 2 + 0.4 })
    this.colliders.push({ minX: x - w / 2 - 0.4, maxX: x + w / 2 + 0.4, minZ: z + d / 2 - 0.4, maxZ: z + d / 2 + 0.4 })
    this.colliders.push({ minX: x - w / 2 - 0.4, maxX: x - w / 2 + 0.4, minZ: z - d / 2, maxZ: z + d / 2 })
    this.colliders.push({ minX: x + w / 2 - 0.4, maxX: x + w / 2 + 0.4, minZ: z - d / 2, maxZ: z - 4.5 })
    this.colliders.push({ minX: x + w / 2 - 0.4, maxX: x + w / 2 + 0.4, minZ: z + 4.5, maxZ: z + d / 2 })

    // blocky animals
    const animal = (ax: number, az: number, bodyC: string, w2: number, h2: number, d2: number, headC?: string) => {
      box(w2, h2, d2, bodyC, ax, h2 / 2 + 0.2, az, g)
      box(w2 * 0.6, w2 * 0.6, w2 * 0.6, headC ?? bodyC, ax, h2 + 0.2 + w2 * 0.3, az - d2 / 2, g)
    }
    animal(x - 6, z - 4, '#a4715a', 2.4, 2, 3.6, '#8a5c42') // dog
    animal(x + 4, z + 3, '#9a9aa4', 1.8, 1.6, 2.8) // cat
    animal(x - 2, z + 6, '#f4f4f0', 1.6, 1.5, 2.2) // bunny
    box(0.5, 1.6, 0.5, '#f4f4f0', x - 2 + 0.4, 3.2, z + 6 - 1.1, g) // bunny ear
    box(0.5, 1.6, 0.5, '#f4f4f0', x - 2 - 0.4, 3.2, z + 6 - 1.1, g)
    animal(x + 7, z - 6, '#f5c84c', 2.2, 1.9, 3.2) // chick? little pony!
    textSprite('Animal Sanctuary', this.cityGroup, x, 12, z)
    this.zones.push({
      minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2,
      message: '🐾 Welcome to the Animal Sanctuary! Say hi to the animals!', active: false,
    })
  }

  private bigSign(x: number, z: number) {
    const g = this.cityGroup
    cylinder(0.9, 1.1, 9, '#8a6a52', x - 15, 4.5, z, g, 8)
    cylinder(0.9, 1.1, 9, '#8a6a52', x + 15, 4.5, z, g, 8)
    this.colliders.push({ minX: x - 16.2, maxX: x - 13.8, minZ: z - 1.2, maxZ: z + 1.2 })
    this.colliders.push({ minX: x + 13.8, maxX: x + 16.2, minZ: z - 1.2, maxZ: z + 1.2 })

    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fffdf8'
    ctx.beginPath()
    ctx.roundRect(0, 0, 1024, 256, 36)
    ctx.fill()
    ctx.lineWidth = 14
    ctx.strokeStyle = '#7a5fa8'
    ctx.stroke()
    for (const [cx, c] of [[80, '#e4544f'], [512, '#f5c84c'], [944, '#5a8fd6']] as const) {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(cx, 46, 22, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#6a4f9e'
    ctx.font = "800 92px 'Baloo 2', sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText("Jackie and James's World", 512, 152)
    const tex = new THREE.CanvasTexture(canvas)
    const face = new THREE.MeshLambertMaterial({ map: tex })
    const blank = new THREE.MeshLambertMaterial({ color: '#fffdf8' })
    const board = new THREE.Mesh(new THREE.BoxGeometry(36, 9, 0.7), [blank, blank, blank, blank, face, face])
    board.position.set(x, 11, z)
    g.add(board)
  }

  private tennisCourts(x: number, z: number) {
    const g = this.cityGroup
    for (const cz of [z - 19, z + 19]) {
      box(20, 0.22, 34, '#3d6b40', x, 0.11, cz, g)
      box(15, 0.24, 28, '#4a7ab5', x, 0.12, cz, g)
      // lines
      box(15, 0.06, 0.6, '#ffffff', x, 0.26, cz - 14, g)
      box(15, 0.06, 0.6, '#ffffff', x, 0.26, cz + 14, g)
      box(0.6, 0.06, 28, '#ffffff', x - 7.5, 0.26, cz, g)
      box(0.6, 0.06, 28, '#ffffff', x + 7.5, 0.26, cz, g)
      box(0.5, 0.06, 28, '#ffffff', x, 0.26, cz, g)
      // net
      cylinder(0.25, 0.25, 2, '#4a4a52', x - 8.4, 1, cz, g, 6)
      cylinder(0.25, 0.25, 2, '#4a4a52', x + 8.4, 1, cz, g, 6)
      const net = new THREE.Mesh(new THREE.BoxGeometry(16.8, 1.5, 0.1), new THREE.MeshLambertMaterial({ color: '#f4f4f0', transparent: true, opacity: 0.55 }))
      net.position.set(x, 1, cz)
      g.add(net)
      box(16.8, 0.18, 0.16, '#ffffff', x, 1.75, cz, g)
    }
    textSprite('Tennis Courts', g, x, 11, z)
    this.zones.push({ minX: x - 11, maxX: x + 11, minZ: z - 37, maxZ: z + 37, message: '🎾 Tennis, anyone? Serve it up!', active: false })
  }

  private swimmingPool(x: number, z: number) {
    const g = this.cityGroup
    box(38, 0.3, 30, '#d8d2c8', x, 0.15, z, g) // deck
    box(30, 0.22, 22, '#6fc0e8', x, 0.2, z, g) // water
    // ladder
    cylinder(0.18, 0.18, 2.4, '#e8e8e8', x + 15.2, 1.2, z - 3, g, 6)
    cylinder(0.18, 0.18, 2.4, '#e8e8e8', x + 15.2, 1.2, z + 3, g, 6)
    box(0.16, 0.16, 6, '#e8e8e8', x + 15.2, 1.9, z, g)
    // diving board
    box(1.6, 2.2, 1.6, '#9a9aa4', x, 1.1, z + 13.4, g)
    box(2.2, 0.4, 7, '#f4f4f0', x, 2.4, z + 9.6, g)
    // floatie + beach ball
    const floatie = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.6, 10, 18), mat('#f2a0bd'))
    floatie.rotation.x = Math.PI / 2
    floatie.position.set(x - 6, 0.6, z + 3)
    g.add(floatie)
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mat('#f5c84c'))
    ball.position.set(x + 8, 1.1, z - 14.2, )
    g.add(ball)
    textSprite('Swimming Pool', g, x, 10, z)
    this.poolWater = { minX: x - 15, maxX: x + 15, minZ: z - 11, maxZ: z + 11 }
    this.zones.push({ minX: x - 19, maxX: x + 19, minZ: z - 15, maxZ: z + 15, message: '🏊 Splash time! Wade right in!', active: false })
  }

  // ---------------- the lake ----------------

  private lake() {
    const g = this.cityGroup
    const w = LAKE.maxX - LAKE.minX
    const d = LAKE.maxZ - LAKE.minZ
    const cx = (LAKE.minX + LAKE.maxX) / 2
    const cz = (LAKE.minZ + LAKE.maxZ) / 2
    box(w + 8, 0.14, d + 8, '#eadbb0', cx, 0.07, cz, g) // sandy rim
    box(w, 0.18, d, '#4f9fd8', cx, 0.09, cz, g) // water

    // shore walls (invisible): keep walkers out of the water except at the dock
    const wall = (minX: number, maxX: number, minZ: number, maxZ: number) =>
      this.colliders.push({ minX, maxX, minZ, maxZ })
    wall(LAKE.minX - 1, LAKE.minX + 1, LAKE.minZ - 1, 17.5) // west, north of dock gap
    wall(LAKE.minX - 1, LAKE.minX + 1, 22.5, LAKE.maxZ + 1) // west, south of dock gap
    wall(LAKE.minX - 1, LAKE.maxX + 1, LAKE.minZ - 1.5, LAKE.minZ + 0.5)
    wall(LAKE.minX - 1, LAKE.maxX + 1, LAKE.maxZ - 0.5, LAKE.maxZ + 1.5)

    // dock (with invisible side rails so nobody strolls onto the water)
    box(18, 0.5, 4.4, '#c99a52', 105, 0.5, 20, g)
    wall(105, 116.5, 16.6, 17.6)
    wall(105, 116.5, 22.4, 23.4)
    wall(115.8, 116.8, 16.5, 23.5)
    for (const px of [98, 105, 112]) {
      cylinder(0.4, 0.4, 1.6, '#8a6a52', px, 0.4, 17.9, g, 6)
      cylinder(0.4, 0.4, 1.6, '#8a6a52', px, 0.4, 22.1, g, 6)
    }
    textSprite('Boat Dock', g, 108, 9, 20)
    this.zones.push({ minX: 92, maxX: 116, minZ: 12, maxZ: 28, message: '⛵ Walk to the end of the dock to hop in the boat!', active: false })

    // the drivable boat
    this.boatGroup = this.buildBoat('#e4544f')
    this.boatGroup.position.set(BOAT_PARK.x, 0.2, BOAT_PARK.z)
    this.boatGroup.rotation.y = this.boatRot
    g.add(this.boatGroup)

    // anchored sailboats
    for (const [bx, bz, c] of [[135, -15, '#6db56a'], [120, 100, '#f5c84c']] as const) {
      const sail = this.buildBoat(c)
      sail.position.set(bx, 0.2, bz)
      sail.rotation.y = Math.random() * Math.PI * 2
      cylinder(0.22, 0.22, 7, '#f4f4f0', 0, 5, 0, sail, 6)
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.4, 3.4), mat('#fffdf8'))
      cloth.position.set(0, 5.6, -1.9)
      sail.add(cloth)
      this.anchored.push(sail)
      g.add(sail)
    }

    // treasure island
    const island = new THREE.Group()
    island.position.set(140, 0, 55)
    cylinder(12, 13.5, 1.6, '#eadbb0', 0, 0.8, 0, island, 20)
    cylinder(0.7, 0.9, 7, '#8a6a52', 2, 4.5, -2, island, 8)
    for (const [rx, rz] of [[3.4, 0], [-3.4, 0], [0, 3.4], [0, -3.4]] as const) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(rx) > 0 ? 6 : 2, 0.5, Math.abs(rz) > 0 ? 6 : 2), mat('#4e9a4e'))
      leaf.position.set(2 + rx * 0.8, 8, -2 + rz * 0.8)
      island.add(leaf)
    }
    box(3, 2, 2, '#8a6a52', -4, 2.6, 3, island) // treasure chest
    box(3.2, 0.7, 2.2, '#5a4236', -4, 3.8, 3, island)
    for (const [gx, gz] of [[-4.6, 3], [-3.5, 2.7], [-4, 3.4]] as const) {
      const coin = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat('#f5c84c'))
      coin.position.set(gx, 3.8, gz)
      island.add(coin)
    }
    g.add(island)
    this.lakeZones.push({ minX: 122, maxX: 158, minZ: 37, maxZ: 73, message: '🏝️ A secret treasure island! Shiny!', active: false })

    // fountain
    const fBase = new THREE.Group()
    fBase.position.set(152, 0, -5)
    cylinder(4.4, 4.8, 1.4, '#d8d2c8', 0, 0.7, 0, fBase, 16)
    cylinder(3.6, 3.6, 0.6, '#6fc0e8', 0, 1.3, 0, fBase, 16)
    this.fountainJet = cylinder(0.5, 0.9, 5, '#bfe0f8', 0, 3.5, 0, fBase, 10)
    const splash = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), mat('#dff0fb'))
    splash.position.set(0, 6.2, 0)
    fBase.add(splash)
    g.add(fBase)
    this.lakeZones.push({ minX: 143, maxX: 161, minZ: -14, maxZ: 4, message: '💦 The magic fountain! Make a wish!', active: false })

    // paddling ducks (positions animated each frame)
    for (let i = 0; i < 3; i++) {
      const duck = new THREE.Group()
      box(1.6, 1, 2.2, '#f5c84c', 0, 0.7, 0, duck)
      box(1, 1, 1, '#f5c84c', 0, 1.6, -1, duck)
      box(0.6, 0.3, 0.7, '#f28c3b', 0, 1.5, -1.7, duck)
      g.add(duck)
      this.ducks.push(duck)
    }
    this.lakeZones.push({ minX: 110, maxX: 132, minZ: 64, maxZ: 88, message: '🦆 Quack quack! The ducks say hello!', active: false })

    // striped buoys
    for (const o of LAKE_OBSTACLES.slice(4, 8)) {
      cylinder(0.9, 1.1, 1.8, '#e4544f', o.x, 0.8, o.z, g, 10)
      cylinder(0.92, 0.92, 0.5, '#f4f4f0', o.x, 0.9, o.z, g, 10)
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), mat('#f5c84c'))
      light.position.set(o.x, 1.95, o.z)
      g.add(light)
    }

    // drifting logs (they roll in place)
    for (const o of LAKE_OBSTACLES.slice(8)) {
      const log = cylinder(1, 1, 6, '#8a6a52', o.x, 0.55, o.z, g, 10)
      log.rotation.z = Math.PI / 2
      log.rotation.y = (o.x + o.z) % 1.4
      this.logs.push(log)
    }

    // jump ramps!
    for (const r of JUMP_RAMPS) {
      const ramp = new THREE.Group()
      ramp.position.set(r.x, 0.3, r.z)
      const wedge = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.6, 8), mat('#f28c3b'))
      wedge.rotation.x = 0.4
      wedge.position.y = 1.4
      ramp.add(wedge)
      box(0.5, 0.4, 8, '#f4f4f0', -2.7, 1.6, 0, ramp)
      box(0.5, 0.4, 8, '#f4f4f0', 2.7, 1.6, 0, ramp)
      const wedge2 = ramp.children[1] as THREE.Mesh
      wedge2.rotation.x = 0.4
      const wedge3 = ramp.children[2] as THREE.Mesh
      wedge3.rotation.x = 0.4
      g.add(ramp)
      textSprite('Jump!', g, r.x, 7, r.z, 0.7)
    }

    // rolling wave foam
    const waveGeo = new THREE.BoxGeometry(7, 0.1, 1.1)
    for (let i = 0; i < 14; i++) {
      const foam = new THREE.Mesh(waveGeo, new THREE.MeshLambertMaterial({ color: '#e8f4fb', transparent: true, opacity: 0.5 }))
      const wz = LAKE.minZ + 6 + ((i * 37) % (LAKE.maxZ - LAKE.minZ - 12))
      foam.position.set(LAKE.minX + ((i * 23) % 60), 0.22, wz)
      g.add(foam)
      this.waveStrips.push({ mesh: foam, baseX: (i * 23) % 60, speed: 2 + (i % 3) })
    }

    // Bubbles, the friendly lake monster (swims a slow circle)
    for (let s = 0; s < 4; s++) {
      const seg = new THREE.Group()
      if (s === 0) {
        box(2.4, 2.2, 2.6, '#4e9a4e', 0, 2.6, 0, seg) // head
        box(1.6, 1.4, 1.4, '#4e9a4e', 0, 1, -0.4, seg) // neck
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), mat('#fffdf8'))
        eyeL.position.set(-0.7, 3, 1.1)
        seg.add(eyeL)
        const eyeR = eyeL.clone()
        eyeR.position.x = 0.7
        seg.add(eyeR)
        const pupL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), mat('#3a3440'))
        pupL.position.set(-0.7, 3, 1.38)
        seg.add(pupL)
        const pupR = pupL.clone()
        pupR.position.x = 0.7
        seg.add(pupR)
        box(1, 0.3, 0.6, '#f2a0bd', 0, 1.9, 1.34, seg) // smile
      } else {
        const hump = new THREE.Mesh(new THREE.SphereGeometry(1.7 - s * 0.18, 12, 10), mat('#4e9a4e'))
        hump.position.y = 0.5
        seg.add(hump)
      }
      this.monsterSegs.push(seg)
      g.add(seg)
    }
    this.lakeZones.push({
      minX: MONSTER.x - 18, maxX: MONSTER.x + 18, minZ: MONSTER.z - 18, maxZ: MONSTER.z + 18,
      message: "🐉 It's Bubbles the friendly lake monster! Don't bump his humps!", active: false,
    })

    // splash effect for jump landings
    this.splashMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.4, 0.25, 16),
      new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }),
    )
    this.splashMesh.visible = false
    g.add(this.splashMesh)

    // sandcastle beach on the west shore
    box(14, 0.24, 40, '#eadbb0', 98, 0.12, 88, g)
    cylinder(0.25, 0.25, 7, '#8a6a52', 96, 3.5, 78, g, 6)
    cylinder(0.3, 5, 2.6, '#e4544f', 96, 7.6, 78, g, 12)
    box(3, 2.2, 3, '#e8cf9a', 99, 1.2, 94, g)
    box(1.2, 1.6, 1.2, '#e8cf9a', 97.8, 3, 92.9, g)
    box(1.2, 2.4, 1.2, '#e8cf9a', 100.2, 3.4, 95.1, g)
    this.zones.push({ minX: 91, maxX: 105, minZ: 68, maxZ: 108, message: '🏖️ Beach day! Look at that sandcastle!', active: false })
  }

  private buildBoat(color: string): THREE.Group {
    const b = new THREE.Group()
    box(5, 1.7, 10, color, 0, 0.85, 0, b) // hull
    box(4, 0.6, 8.4, '#f7ecd9', 0, 1.9, 0.4, b) // deck
    box(4.6, 1.4, 2, color, 0, 2.4, -3.6, b) // bow cabin
    const shield = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 0.15), new THREE.MeshLambertMaterial({ color: '#cfe8f8', transparent: true, opacity: 0.6 }))
    shield.position.set(0, 3.5, -2.7)
    shield.rotation.x = -0.25
    b.add(shield)
    cylinder(0.5, 0.5, 0.24, '#5a4a68', 0, 2.9, -1.6, b, 12) // wheel
    cylinder(0.09, 0.09, 1, '#5a4a68', 0, 2.5, -1.6, b, 6)
    box(3, 0.8, 1.4, '#c99a52', 0, 2.3, 1.6, b) // bench seat
    cylinder(0.12, 0.12, 3.4, '#f4f4f0', 0, 3.6, 4.4, b, 6) // stern flag pole
    const flag = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 0.12), mat('#f5c84c'))
    flag.position.set(0.9, 4.8, 4.4)
    b.add(flag)
    return b
  }

  // ---------------- character ----------------

  private buildCharacter(spec: CharacterSpec): THREE.Group {
    const g = new THREE.Group()

    const legL = new THREE.Group()
    const legR = new THREE.Group()
    legL.position.set(-0.55, 1.9, 0)
    legR.position.set(0.55, 1.9, 0)
    box(0.9, 1.9, 1, spec.pants, 0, -0.95, 0, legL)
    box(0.9, 1.9, 1, spec.pants, 0, -0.95, 0, legR)
    g.add(legL, legR)

    box(2.2, 0.7, 1.2, spec.pants, 0, 2.2, 0, g) // hips
    const torso = box(2.4, 2.2, 1.3, spec.shirt, 0, 3.6, 0, g)
    torso.scale.set(1, 1, 1)

    const armL = new THREE.Group()
    const armR = new THREE.Group()
    armL.position.set(-1.5, 4.4, 0)
    armR.position.set(1.5, 4.4, 0)
    box(0.7, 1.9, 0.9, spec.shirt, 0, -0.8, 0, armL)
    box(0.6, 0.6, 0.8, spec.skin, 0, -1.9, 0, armL)
    box(0.7, 1.9, 0.9, spec.shirt, 0, -0.8, 0, armR)
    box(0.6, 0.6, 0.8, spec.skin, 0, -1.9, 0, armR)
    g.add(armL, armR)

    box(1.7, 1.6, 1.5, spec.skin, 0, 5.6, 0, g) // head
    // face
    box(0.22, 0.3, 0.1, '#3a3440', -0.4, 5.75, 0.78, g)
    box(0.22, 0.3, 0.1, '#3a3440', 0.4, 5.75, 0.78, g)
    box(0.7, 0.16, 0.1, '#b3543f', 0, 5.25, 0.78, g)

    // hair
    box(1.85, 0.6, 1.65, spec.hair, 0, 6.5, 0, g)
    box(1.85, 0.7, 0.5, spec.hair, 0, 6.1, -0.6, g)
    if (spec.hairstyle === 'spiky') {
      box(0.5, 0.5, 0.5, spec.hair, -0.5, 6.95, 0, g)
      box(0.5, 0.5, 0.5, spec.hair, 0.2, 7.05, -0.3, g)
      box(0.5, 0.5, 0.5, spec.hair, 0.6, 6.9, 0.3, g)
    } else if (spec.hairstyle === 'ponytail') {
      box(0.7, 1.7, 0.7, spec.hair, 0, 5.7, -1.05, g)
    } else if (spec.hairstyle === 'buns') {
      box(0.8, 0.8, 0.8, spec.hair, -1, 6.9, 0, g)
      box(0.8, 0.8, 0.8, spec.hair, 1, 6.9, 0, g)
    } else if (spec.hairstyle === 'long') {
      box(2.1, 2.2, 0.6, spec.hair, 0, 5.5, -0.85, g)
      box(0.45, 1.6, 1.4, spec.hair, -1.05, 5.5, 0, g)
      box(0.45, 1.6, 1.4, spec.hair, 1.05, 5.5, 0, g)
    }

    this.limbs = { armL, armR, legL, legR }
    return g
  }

  // ---------------- interiors ----------------

  private buildInterior(b: BuildingCfg): THREE.Group {
    const g = new THREE.Group()
    const big = b.type === 'fashion' || b.type === 'highschool' || b.type === 'hospital'
    const W = big ? 38 : 30
    const D = big ? 26 : 22
    const H = 9

    // open "dollhouse" front — the camera looks in from where the fourth wall would be
    box(W, 1, D, '#e8ddcc', 0, -0.5, 0, g) // floor
    box(W, H, 1, '#f0e8f8', 0, H / 2, -D / 2, g) // back wall
    box(1, H, D, '#e3d6f0', -W / 2, H / 2, 0, g)
    box(1, H, D, '#e3d6f0', W / 2, H / 2, 0, g)
    // door posts marking the way out + welcome mat
    box(1, 6, 1, '#c9b8e0', -3.2, 3, D / 2 - 0.5, g)
    box(1, 6, 1, '#c9b8e0', 3.2, 3, D / 2 - 0.5, g)
    box(7.4, 0.6, 1, '#c9b8e0', 0, 6.3, D / 2 - 0.5, g)
    box(5, 0.1, 2.8, '#e4544f', 0, 0.06, D / 2 - 1.6, g)

    this.interiorColliders = [
      { minX: -W / 2 + 1, maxX: W / 2 - 1, minZ: -D / 2 + 1, maxZ: -D / 2 + 1 }, // back (thin)
    ]
    // simpler: clamp inside walls, plus prop colliders below
    this.interiorColliders = []
    const clampW = W / 2 - 1.6
    const clampD = D / 2 - 1.6
    ;(g.userData as { clampW?: number; clampD?: number }).clampW = clampW
    ;(g.userData as { clampD?: number }).clampD = clampD

    const prop = (
      w: number, h: number, d: number, color: string, x: number, z: number, y = h / 2,
    ) => {
      box(w, h, d, color, x, y, z, g)
      this.interiorColliders.push({ minX: x - w / 2 - 0.4, maxX: x + w / 2 + 0.4, minZ: z - d / 2 - 0.4, maxZ: z + d / 2 + 0.4 })
    }

    const bed = (x: number, z: number, blanket: string) => {
      prop(4, 1.2, 7, '#c99a52', x, z)
      box(3.6, 0.7, 4.4, blanket, x, 1.5, z + 0.9, g)
      box(3, 0.7, 1.6, '#ffffff', x, 1.5, z - 2.2, g)
    }

    switch (b.type) {
      case 'house':
        bed(-W / 2 + 4, -D / 2 + 5.5, HOUSE_COLORS[Math.floor(Math.random() * 14)])
        prop(5, 2.4, 3, '#a4715a', 5, -D / 2 + 5) // table
        prop(1.6, 1.6, 1.6, '#e4544f', 2.2, -D / 2 + 5)
        prop(1.6, 1.6, 1.6, '#5a8fd6', 7.8, -D / 2 + 5)
        box(6, 4, 0.5, '#3a3440', W / 2 - 4, 3, -D / 2 + 0.8, g) // TV on wall
        box(8, 0.12, 6, '#f2a0bd', 0, 0.07, 2, g) // rug
        break
      case 'hospital':
        for (const x of [-12, -4, 4, 12]) bed(x, -D / 2 + 5.5, '#e4544f')
        prop(8, 3, 3, '#f4f4f0', -12, D / 2 - 5.5) // reception counter
        box(1.4, 4.2, 0.4, '#e4544f', 0, 5.4, -D / 2 + 0.8, g)
        box(4.2, 1.4, 0.4, '#e4544f', 0, 5.4, -D / 2 + 0.8, g)
        break
      case 'preschool':
        box(9, 4.5, 0.4, '#3d6b40', 0, 4, -D / 2 + 0.8, g) // chalkboard
        prop(6, 1.6, 4, '#f5c84c', -8, -2)
        prop(6, 1.6, 4, '#6db56a', 8, -2)
        for (let i = 0; i < 6; i++) {
          box(1.1, 1.1, 1.1, HOUSE_COLORS[i], -6 + i * 2.4, 0.55, 5, g) // toy blocks
        }
        break
      case 'highschool':
        box(12, 5, 0.4, '#3d6b40', 0, 4.4, -D / 2 + 0.8, g)
        for (const x of [-12, -4, 4, 12]) {
          for (const z of [-3, 3]) {
            prop(4, 2.2, 2.4, '#c99a52', x, z)
          }
        }
        break
      case 'clothing': {
        const rack = (x: number, z: number) => {
          prop(8, 0.3, 1, '#9a9aa4', x, z, 4.4)
          cylinder(0.2, 0.2, 4.4, '#9a9aa4', x - 3.8, 2.2, z, g, 6)
          cylinder(0.2, 0.2, 4.4, '#9a9aa4', x + 3.8, 2.2, z, g, 6)
          for (let i = 0; i < 5; i++) {
            box(1.2, 2, 0.5, HOUSE_COLORS[(i * 3 + 2) % 14], x - 3 + i * 1.5, 3.2, z, g)
          }
        }
        rack(-8, -4)
        rack(8, -4)
        prop(7, 3, 3, '#a4715a', -9, D / 2 - 6) // counter
        box(4, 5, 0.4, '#cfe8f8', W / 2 - 3, 3.4, -D / 2 + 0.8, g) // mirror
        break
      }
      case 'accessory':
        for (const [x, z] of [[-8, -3], [0, -5], [8, -3]] as const) {
          prop(5, 2.6, 3, '#f4f4f0', x, z)
          for (let i = 0; i < 3; i++) {
            const gem = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(HOUSE_COLORS[(i * 5 + 1) % 14]))
            gem.position.set(x - 1.4 + i * 1.4, 3.2, z)
            g.add(gem)
          }
        }
        break
      case 'fashion': {
        const rack2 = (x: number, z: number) => {
          prop(9, 0.3, 1, '#9a9aa4', x, z, 4.4)
          cylinder(0.2, 0.2, 4.4, '#9a9aa4', x - 4.2, 2.2, z, g, 6)
          cylinder(0.2, 0.2, 4.4, '#9a9aa4', x + 4.2, 2.2, z, g, 6)
          for (let i = 0; i < 6; i++) {
            box(1.2, 2.2, 0.5, HOUSE_COLORS[(i * 2 + 3) % 14], x - 3.7 + i * 1.5, 3.2, z, g)
          }
        }
        rack2(-11, -6)
        rack2(11, -6)
        rack2(-11, 2)
        rack2(11, 2)
        // mannequins
        for (const x of [-3, 3]) {
          prop(1.4, 0.4, 1.4, '#d8d2c8', x, -8, 0.2)
          box(1.6, 2.4, 1, '#d8d2c8', x, 2.6, -8, g)
          box(1, 1, 1, '#e8e2d8', x, 4.4, -8, g)
        }
        prop(8, 3, 3, '#a4715a', -13, D / 2 - 6)
        break
      }
    }

    return g
  }

  /**
   * Five stacked rooms shown one at a time. Green mats go up a floor, blue
   * mats come down, and the pink mat on the Slide Floor whooshes you down to
   * the Gaming Room. The exit mat is on the ground floor only.
   */
  private buildCommunityFloors() {
    const W = 34
    const D = 24
    const H = 9
    this.floors = []
    this.floorColliders = []

    for (let f = 0; f < 5; f++) {
      const g = new THREE.Group()
      const colliders: Collider[] = []
      const prop = (w: number, h: number, d: number, color: string, x: number, z: number, y = h / 2) => {
        box(w, h, d, color, x, y, z, g)
        colliders.push({ minX: x - w / 2 - 0.4, maxX: x + w / 2 + 0.4, minZ: z - d / 2 - 0.4, maxZ: z + d / 2 + 0.4 })
      }

      const rooftop = f === 4
      box(W, 1, D, rooftop ? '#b6d6a8' : '#e8ddcc', 0, -0.5, 0, g)
      if (!rooftop) {
        box(W, H, 1, '#f0e8f8', 0, H / 2, -D / 2, g)
        box(1, H, D, '#e3d6f0', -W / 2, H / 2, 0, g)
        box(1, H, D, '#e3d6f0', W / 2, H / 2, 0, g)
      } else {
        // railing around the roof
        box(W, 1.4, 0.5, '#d8d2c8', 0, 0.7, -D / 2, g)
        box(0.5, 1.4, D, '#d8d2c8', -W / 2, 0.7, 0, g)
        box(0.5, 1.4, D, '#d8d2c8', W / 2, 0.7, 0, g)
        box(W, 1.4, 0.5, '#d8d2c8', 0, 0.7, D / 2, g)
        for (let i = 0; i < 9; i++) {
          const lx = -W / 2 + 2 + i * (W - 4) / 8
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(i % 2 ? '#f5c84c' : '#f2a0bd'))
          bulb.position.set(lx, 1.9, -D / 2)
          g.add(bulb)
        }
      }

      // stairs: green "up" mat back-right, blue "down" mat back-left
      if (f < 4) {
        box(3.2, 0.12, 3.2, '#6db56a', W / 2 - 3.5, 0.07, -D / 2 + 3.5, g)
        for (let s = 0; s < 4; s++) box(2.6, 0.5 + s * 0.5, 0.9, '#c9b8e0', W / 2 - 3.5, (0.5 + s * 0.5) / 2, -D / 2 + 6.5 - s * 0.95, g)
        textSprite('Stairs up', g, W / 2 - 3.5, 5.4, -D / 2 + 3.5, 0.62)
      }
      if (f > 0) {
        box(3.2, 0.12, 3.2, '#5a8fd6', -W / 2 + 3.5, 0.07, -D / 2 + 3.5, g)
        textSprite('Stairs down', g, -W / 2 + 3.5, 5.4, -D / 2 + 3.5, 0.62)
      }

      if (f === 0) {
        // singing stage
        box(1, 6, 1, '#c9b8e0', -3.2, 3, D / 2 - 0.5, g)
        box(1, 6, 1, '#c9b8e0', 3.2, 3, D / 2 - 0.5, g)
        box(7.4, 0.6, 1, '#c9b8e0', 0, 6.3, D / 2 - 0.5, g)
        box(5, 0.1, 2.8, '#e4544f', 0, 0.06, D / 2 - 1.6, g) // exit mat
        prop(16, 1.4, 7, '#9a6fc4', 0, -D / 2 + 4.5) // stage
        box(4.6, 2.2, 2.4, '#2e2a28', -3, 1.4 + 1.1, -D / 2 + 4.5, g) // piano
        box(4.2, 0.3, 0.9, '#fffdf8', -3, 1.4 + 2.1, -D / 2 + 3.6, g) // keys
        box(2.2, 0.9, 1, '#5a4236', -3, 1.4 + 0.45, -D / 2 + 7.2, g) // bench
        cylinder(0.09, 0.09, 2.6, '#4a4a52', 3.5, 1.4 + 1.3, -D / 2 + 3.4, g, 6) // mic stand
        const micTop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat('#4a4a52'))
        micTop.position.set(3.5, 1.4 + 2.8, -D / 2 + 3.4)
        g.add(micTop)
        prop(2.2, 3.4, 2, '#4a4a52', -12, 2) // speakers
        prop(2.2, 3.4, 2, '#4a4a52', 12, 2)
        for (let i = 0; i < 5; i++) {
          const dot = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.06, 14), mat(HOUSE_COLORS[i * 2 % 14]))
          dot.position.set(-8 + i * 4, 0.05, 4)
          g.add(dot)
        }
      } else if (f === 1) {
        // recording studio
        for (let ix = 0; ix < 8; ix++) for (let iy = 0; iy < 3; iy++) box(3.2, 2.2, 0.3, iy % 2 === ix % 2 ? '#4a4a52' : '#5a5a64', -12.6 + ix * 3.6, 2.4 + iy * 2.5, -D / 2 + 0.8, g)
        prop(10, 2.6, 3.4, '#5a4a68', -6, 2) // mixing desk
        for (let k = 0; k < 6; k++) cylinder(0.24, 0.24, 0.5, HOUSE_COLORS[k % 14], -9.5 + k * 1.5, 2.85, 2, g, 8)
        const glass = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 0.25), new THREE.MeshLambertMaterial({ color: '#cfe8f8', transparent: true, opacity: 0.35 }))
        glass.position.set(9.5, 3, -1)
        g.add(glass)
        prop(0.6, 6, 8, '#9a9aa4', 5.2, -4.4)
        cylinder(0.09, 0.09, 3, '#4a4a52', 10, 1.5, -5, g, 6)
        const stMic = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), mat('#e4544f'))
        stMic.position.set(10, 3.3, -5)
        g.add(stMic)
      } else if (f === 2) {
        // gaming room + slide landing
        box(11, 6, 0.5, '#2e2a28', -8, 3.6, -D / 2 + 0.8, g) // big screen
        box(10, 5, 0.2, '#5f64c8', -8, 3.6, -D / 2 + 1.06, g)
        prop(9, 2, 3.2, '#e4544f', -8, -1) // couch
        prop(2.4, 4.2, 2, '#9a6fc4', 4, -D / 2 + 3.4) // arcade cabinets
        prop(2.4, 4.2, 2, '#f28c3b', 7.2, -D / 2 + 3.4)
        for (const [bx, bz, c] of [[-1, 4, '#6db56a'], [3, 5.5, '#f5c84c']] as const) {
          const bean = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8), mat(c))
          bean.position.set(bx, 0.9, bz)
          bean.scale.y = 0.62
          g.add(bean)
        }
        // slide landing swooping in from above
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 9), mat('#f2a0bd'))
        ramp.position.set(11, 3.4, -1.4)
        ramp.rotation.x = -0.62
        g.add(ramp)
        box(3.4, 0.5, 2.4, '#c9aede', 11, 0.28, 3.4, g) // landing cushion
      } else if (f === 3) {
        // slide floor
        box(3.2, 0.12, 3.2, '#f2a0bd', 11, 0.07, 0, g) // slide mat (the trigger)
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 7), mat('#f2a0bd'))
        ramp.position.set(11, -1.4, 4.4)
        ramp.rotation.x = -0.72
        g.add(ramp)
        box(0.4, 1.2, 3.4, '#c9aede', 9.3, 0.7, 0, g) // rails
        box(0.4, 1.2, 3.4, '#c9aede', 12.7, 0.7, 0, g)
        textSprite('Wheee! ⬇', g, 11, 4.6, 0, 0.62)
        prop(7, 2.6, 4, '#3d6b40', -7, 0) // foosball table
        for (let r = 0; r < 3; r++) cylinder(0.12, 0.12, 5, '#9a9aa4', -9 + r * 2, 3, 0, g, 6)
        for (const [bx, bz, c] of [[-14, 8, '#e4544f'], [-10, 9, '#5a8fd6'], [14, -8, '#f5c84c']] as const) {
          cylinder(0.04, 0.04, 3.4, '#9a9aa4', bx, 1.7, bz, g, 4)
          const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), mat(c))
          balloon.position.set(bx, 4, bz)
          balloon.scale.y = 1.15
          g.add(balloon)
        }
      } else {
        // rooftop garden
        for (const [px, pz] of [[-13, -7], [-13, 3], [13, -7], [13, 3]] as const) {
          prop(4, 1.4, 3, '#8a6a52', px, pz)
          for (let s = 0; s < 3; s++) {
            cylinder(0.07, 0.07, 1.4, '#4e9a4e', px - 1 + s, 2, pz, g, 4)
            const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), mat(HOUSE_COLORS[(px > 0 ? 3 : 0) + s]))
            bloom.position.set(px - 1 + s, 2.9, pz)
            g.add(bloom)
          }
        }
        prop(5, 1.1, 1.6, '#c99a52', 0, -6) // bench
        box(5, 0.3, 0.5, '#c99a52', 0, 1.6, -6.6, g)
        // telescope for stargazing
        cylinder(0.1, 0.1, 2.6, '#5a5a64', 6, 1.3, 6, g, 6)
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 3, 10), mat('#5f64c8'))
        scope.position.set(6, 3.2, 6)
        scope.rotation.x = 1
        g.add(scope)
        textSprite('Rooftop Garden 🌸', g, 0, 8, 0, 0.9)
      }

      ;(g.userData as { clampW?: number; clampD?: number }).clampW = W / 2 - 1.6
      ;(g.userData as { clampD?: number }).clampD = D / 2 - 1.6
      this.floors.push(g)
      this.floorColliders.push(colliders)
    }
  }

  /** Handle up/down/slide mats inside the community center. */
  private communityFloorTriggers(p: THREE.Vector3) {
    const W = 34
    const D = 24
    const near = (x: number, z: number) => (p.x - x) ** 2 + (p.z - z) ** 2 < 4.8
    const goto = (floor: number, x: number, z: number, msg?: string) => {
      if (!this.floors) return
      this.scene.remove(this.floors[this.curFloor])
      this.curFloor = floor
      this.scene.add(this.floors[floor])
      this.interiorColliders = this.floorColliders[floor]
      this.player.position.set(x, 0, z)
      this.doorCooldown = 1.1
      this.cb.onPlace(`Community Center — ${FLOOR_NAMES[floor]}`)
      if (msg) this.toast(msg)
    }
    if (this.curFloor < 4 && near(W / 2 - 3.5, -D / 2 + 3.5)) {
      goto(this.curFloor + 1, -W / 2 + 7.5, -D / 2 + 7.5)
    } else if (this.curFloor > 0 && near(-W / 2 + 3.5, -D / 2 + 3.5)) {
      goto(this.curFloor - 1, W / 2 - 7.5, -D / 2 + 7.5)
    } else if (this.curFloor === 3 && near(11, 0)) {
      goto(2, 11, 4.5, 'Wheeeee! 🎉 What a ride!')
    }
  }

  private enterBuilding(b: BuildingCfg) {
    const door = this.doors.find((d) => d.building === b)!
    this.exitSpot.set(
      b.x + Math.sin(b.rot) * (b.d / 2 + 4.5),
      0,
      b.z + Math.cos(b.rot) * (b.d / 2 + 4.5),
    )
    this.scene.remove(this.cityGroup)
    if (b.type === 'community') {
      this.buildCommunityFloors()
      this.curFloor = 0
      this.interiorGroup = this.floors![0]
      this.interiorColliders = this.floorColliders[0]
      this.scene.add(this.interiorGroup)
      this.cb.onPlace(`Community Center — ${FLOOR_NAMES[0]}`)
      this.toast('🎤 Welcome! Green mats go UP, blue mats come DOWN — find the slide and the rooftop garden!', 4200)
    } else {
      this.interiorGroup = this.buildInterior(b)
      this.scene.add(this.interiorGroup)
      this.cb.onPlace(b.name)
      this.toast(b.type === 'house' ? '🏠 Welcome home! Step on the red mat to go back out.' : `Welcome to the ${b.name}! Step on the red mat to leave.`)
    }
    this.curClampD = this.interiorGroup.userData.clampD as number
    this.exitRot = b.rot
    this.enteredType = b.type
    this.player.position.set(0, 0, this.curClampD - 3.5)
    this.player.rotation.y = 0
    this.interiorExit.set(0, 0, this.curClampD + 0.2)
    this.mode = 'interior'
    this.doorCooldown = 1
    void door
  }

  private exitBuilding() {
    const disposeGroup = (grp: THREE.Group) => {
      this.scene.remove(grp)
      grp.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
        mats.forEach((mm) => {
          const sm = mm as THREE.SpriteMaterial
          if (sm.map) sm.map.dispose()
          mm.dispose()
        })
      })
    }
    if (this.floors) {
      this.floors.forEach(disposeGroup)
      this.floors = null
      this.floorColliders = []
      this.interiorGroup = null
    } else if (this.interiorGroup) {
      disposeGroup(this.interiorGroup)
      this.interiorGroup = null
    }
    this.interiorColliders = []
    this.scene.add(this.cityGroup)
    this.player.position.copy(this.exitSpot)
    this.player.rotation.y = this.exitRot
    this.mode = 'city'
    this.doorCooldown = 1
    this.cb.onPlace(null)
  }

  // ---------------- game loop ----------------

  private loop = (t: number) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min((t - this.lastT) / 1000, 0.05)
    this.lastT = t
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  /** Ambient life: bobbing boats, the fountain jet, paddling ducks. */
  private animateWorld() {
    const t = this.t
    this.ducks.forEach((duck, i) => {
      const a = t * 0.4 + i * 2.09
      duck.position.set(121 + Math.cos(a) * 7, 0.05, 76 + Math.sin(a) * 7)
      duck.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)) + Math.PI
    })
    if (this.fountainJet) {
      const s = 0.8 + 0.3 * Math.sin(t * 3)
      this.fountainJet.scale.y = s
      this.fountainJet.position.y = 1 + 2.5 * s
    }
    this.anchored.forEach((bt, i) => {
      bt.position.y = 0.2 + Math.sin(t * 1.3 + i * 1.7) * 0.15
      bt.rotation.z = Math.sin(t * 1.1 + i) * 0.04
    })
    if (this.mode !== 'boat' && this.boatGroup) {
      this.boatGroup.position.y = 0.2 + Math.sin(t * 1.6) * 0.1
    }
    // foam strips drift east and wrap
    for (const w of this.waveStrips) {
      w.mesh.position.x = LAKE.minX + 3 + ((w.baseX + t * w.speed) % (LAKE.maxX - LAKE.minX - 8))
      w.mesh.position.y = 0.22 + Math.sin(t * 2 + w.baseX) * 0.05
    }
    this.logs.forEach((log, i) => {
      log.rotation.x += 0.003 + i * 0.001
      log.position.y = 0.55 + Math.sin(t * 1.4 + i * 2) * 0.1
    })
    // Bubbles swims a slow circle, head leading three humps
    this.monsterSegs.forEach((seg, s) => {
      const a = t * 0.22 - s * 0.24
      seg.position.set(
        MONSTER.x + Math.cos(a) * MONSTER.r,
        Math.sin(t * 1.8 + s * 1.3) * 0.25 - (s === 0 ? 0 : 0.2),
        MONSTER.z + Math.sin(a) * MONSTER.r,
      )
      if (s === 0) seg.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)) + Math.PI / 2 + Math.PI
    })
    // expanding splash ring after a jump landing
    if (this.splashMesh && this.splashAge < 0.6) {
      this.splashAge += 0.016
      const k = this.splashAge / 0.6
      this.splashMesh.visible = true
      this.splashMesh.scale.set(1 + k * 2.2, 1, 1 + k * 2.2)
      ;(this.splashMesh.material as THREE.MeshLambertMaterial).opacity = 0.8 * (1 - k)
    } else if (this.splashMesh) {
      this.splashMesh.visible = false
    }
  }

  /** Water height under the boat — waves make it roll. */
  private waveY(x: number, z: number) {
    return 0.2 + Math.sin(this.t * 1.7 + x * 0.12) * 0.14 + Math.sin(this.t * 1.1 + z * 0.09) * 0.1
  }

  private boardBoat() {
    this.mode = 'boat'
    this.leftDock = false
    this.doorCooldown = 1.5
    this.cb.onPlace('Sailing the Lake')
    this.toast('⛵ Anchors away! Steer with ◀ ▶, ▲ to sail. Come back to the dock to hop off.', 4200)
  }

  private updateBoat(dt: number) {
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt
    const rawX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0)
    const rawZ = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0)
    this.boatRot -= rawX * 1.9 * dt
    const thr = -rawZ
    const b = this.boatGroup.position

    // Bubbles is a moving obstacle — block against his current segments too
    const blocked = (x: number, z: number) =>
      LAKE_OBSTACLES.some((o) => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + 2.5) ** 2) ||
      this.monsterSegs.some((seg) => (x - seg.position.x) ** 2 + (z - seg.position.z) ** 2 < 5.3 ** 2)

    if (thr !== 0) {
      const step = 20 * dt * thr
      const nx = THREE.MathUtils.clamp(b.x + Math.sin(this.boatRot) * step, LAKE.minX + 4, LAKE.maxX - 4)
      const nz = THREE.MathUtils.clamp(b.z + Math.cos(this.boatRot) * step, LAKE.minZ + 4, LAKE.maxZ - 4)
      if (!blocked(nx, b.z)) b.x = nx
      if (!blocked(b.x, nz)) b.z = nz
    }

    // ramps launch the boat when hit under throttle
    if (!this.airborne && this.jumpCooldown <= 0 && thr > 0) {
      for (const r of JUMP_RAMPS) {
        if ((b.x - r.x) ** 2 + (b.z - r.z) ** 2 < 18) {
          this.airborne = true
          this.vy = 13
          this.jumpCooldown = 2
          this.toast('🚤 Air time! Woohoo!', 1800)
          break
        }
      }
    }

    if (this.airborne) {
      b.y += this.vy * dt
      this.vy -= 28 * dt
      const water = this.waveY(b.x, b.z)
      if (this.vy < 0 && b.y <= water) {
        b.y = water
        this.airborne = false
        this.splashAge = 0
        if (this.splashMesh) this.splashMesh.position.set(b.x, 0.25, b.z)
        this.toast('💦 SPLASH! What a landing!', 2200)
      }
      this.boatGroup.rotation.x += ((this.vy > 0 ? -0.3 : 0.22) - this.boatGroup.rotation.x) * Math.min(1, dt * 5)
    } else {
      b.y = this.waveY(b.x, b.z)
      this.boatGroup.rotation.x += (((thr !== 0 ? -0.035 : 0) + Math.sin(this.t * 1.4 + b.x * 0.1) * 0.045) - this.boatGroup.rotation.x) * Math.min(1, dt * 4)
    }
    this.boatGroup.rotation.y = this.boatRot
    this.boatGroup.rotation.z += (((-rawX * 0.07) + Math.sin(this.t * 1.2 + b.z * 0.08) * 0.04) - this.boatGroup.rotation.z) * Math.min(1, dt * 6)

    // the captain stands at the wheel
    this.player.position.set(
      b.x - Math.sin(this.boatRot) * 0.2,
      b.y + 1.9,
      b.z - Math.cos(this.boatRot) * 0.2,
    )
    this.player.rotation.y = this.boatRot

    // lake sights
    for (const zn of this.lakeZones) {
      const inside = b.x > zn.minX && b.x < zn.maxX && b.z > zn.minZ && b.z < zn.maxZ
      if (inside && !zn.active) {
        zn.active = true
        this.toast(zn.message, 3200)
      } else if (!inside && zn.active) {
        zn.active = false
      }
    }

    // hop off back at the dock
    const dockDist2 = (b.x - BOAT_PARK.x) ** 2 + (b.z - BOAT_PARK.z) ** 2
    if (dockDist2 > 324) this.leftDock = true
    if (this.doorCooldown <= 0 && this.leftDock && dockDist2 < 30) {
      this.boatGroup.position.set(BOAT_PARK.x, 0.2, BOAT_PARK.z)
      this.boatGroup.rotation.set(0, Math.PI / 2, 0)
      this.boatRot = Math.PI / 2
      this.airborne = false
      this.vy = 0
      this.mode = 'city'
      this.player.position.set(110, 0, 20)
      this.player.rotation.y = -Math.PI / 2
      this.doorCooldown = 1.5
      this.cb.onPlace(null)
      this.toast('🚶 Back on dry land! That was a great sail!')
    }
  }

  private update(dt: number) {
    if (this.doorCooldown > 0) this.doorCooldown -= dt
    this.t += dt
    this.animateWorld()

    if (this.mode === 'boat') {
      this.updateBoat(dt)
      if (this.limbs) {
        this.limbs.armL.rotation.x *= 0.8
        this.limbs.armR.rotation.x *= 0.8
        this.limbs.legL.rotation.x *= 0.8
        this.limbs.legR.rotation.x *= 0.8
      }
      this.updateCamera(dt)
      return
    }

    const rawX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0)
    const rawZ = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0)
    let vx = 0
    let vz = 0
    if (this.view === 'first') {
      // camera-relative: left/right turn, up walks forward, down backs up
      if (rawX !== 0) this.player.rotation.y -= rawX * 2.8 * dt
      if (rawZ !== 0) {
        const r = this.player.rotation.y
        vx = Math.sin(r) * -rawZ
        vz = Math.cos(r) * -rawZ
      }
    } else {
      vx = rawX
      vz = rawZ
    }
    const moving = vx !== 0 || vz !== 0
    if (moving) {
      const len = Math.hypot(vx, vz)
      vx /= len
      vz /= len
      const p = this.player.position
      const colliders = this.mode === 'city' ? this.colliders : this.interiorColliders

      const tryMove = (nx: number, nz: number) => {
        for (const c of colliders) {
          if (
            nx > c.minX - PLAYER_RADIUS && nx < c.maxX + PLAYER_RADIUS &&
            nz > c.minZ - PLAYER_RADIUS && nz < c.maxZ + PLAYER_RADIUS
          ) return false
        }
        return true
      }

      let nx = p.x + vx * PLAYER_SPEED * dt
      let nz = p.z + vz * PLAYER_SPEED * dt
      if (this.mode === 'city') {
        nx = THREE.MathUtils.clamp(nx, -BOUND_X, BOUND_X)
        nz = THREE.MathUtils.clamp(nz, -BOUND_Z, BOUND_Z)
      } else if (this.interiorGroup) {
        const cw = this.interiorGroup.userData.clampW as number
        const cd = this.interiorGroup.userData.clampD as number
        nx = THREE.MathUtils.clamp(nx, -cw, cw)
        nz = THREE.MathUtils.clamp(nz, -cd, cd + 0.6)
      }
      if (tryMove(nx, p.z)) p.x = nx
      if (tryMove(p.x, nz)) p.z = nz

      if (this.view === 'third') {
        const target = Math.atan2(vx, vz)
        const cur = this.player.rotation.y
        let diff = target - cur
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        this.player.rotation.y = cur + diff * Math.min(1, dt * 14)
      }

      this.walkPhase += dt * 11
      if (this.limbs) {
        const s = Math.sin(this.walkPhase) * 0.6
        this.limbs.armL.rotation.x = s
        this.limbs.armR.rotation.x = -s
        this.limbs.legL.rotation.x = -s
        this.limbs.legR.rotation.x = s
      }
    } else if (this.limbs) {
      this.limbs.armL.rotation.x *= 0.8
      this.limbs.armR.rotation.x *= 0.8
      this.limbs.legL.rotation.x *= 0.8
      this.limbs.legR.rotation.x *= 0.8
    }

    // triggers
    const p = this.player.position
    if (this.mode === 'city') {
      // wading in the swimming pool
      const pw = this.poolWater
      p.y = p.x > pw.minX && p.x < pw.maxX && p.z > pw.minZ && p.z < pw.maxZ ? -0.95 : 0
    }
    if (this.mode === 'city' && this.doorCooldown <= 0) {
      if ((p.x - DOCK_END.x) ** 2 + (p.z - DOCK_END.z) ** 2 < 9) {
        this.boardBoat()
        this.updateCamera(dt)
        return
      }
      for (const d of this.doors) {
        if ((p.x - d.x) ** 2 + (p.z - d.z) ** 2 < 4.6) {
          this.enterBuilding(d.building)
          break
        }
      }
      for (const zn of this.zones) {
        const inside = p.x > zn.minX && p.x < zn.maxX && p.z > zn.minZ && p.z < zn.maxZ
        if (inside && !zn.active) {
          zn.active = true
          this.toast(zn.message, 3200)
        } else if (!inside && zn.active) {
          zn.active = false
        }
      }
    } else if (this.mode === 'interior' && this.doorCooldown <= 0) {
      if (this.enteredType === 'community') this.communityFloorTriggers(p)
      const atExit = (p.x - this.interiorExit.x) ** 2 + (p.z - this.interiorExit.z) ** 2 < 5
      if (atExit && (this.enteredType !== 'community' || this.curFloor === 0)) {
        this.exitBuilding()
      }
    }

    this.updateCamera(dt)
  }

  /** Bird's-eye follow, dollhouse interior view, or eye-level first person. */
  private updateCamera(dt: number) {
    const p = this.player.position
    if (this.view === 'first') {
      const rot = this.player.rotation.y
      const fx = Math.sin(rot)
      const fz = Math.cos(rot)
      const camTarget = new THREE.Vector3(p.x - fx * 1.2, p.y + 5.6, p.z - fz * 1.2)
      this.camera.position.lerp(camTarget, Math.min(1, dt * 10))
      this.camera.lookAt(p.x + fx * 12, p.y + 4.2, p.z + fz * 12)
    } else {
      const camTarget = this.mode !== 'interior'
        ? new THREE.Vector3(p.x, 22, p.z + 27)
        : new THREE.Vector3(p.x * 0.4, 14, this.curClampD + 15)
      this.camera.position.lerp(camTarget, Math.min(1, dt * 5))
      this.camera.lookAt(p.x, p.y + 2, p.z)
    }
    this.camera.up.copy(V_UP)
  }
}
