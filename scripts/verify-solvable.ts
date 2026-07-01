// Verify Microban level 1 is solvable by brute-force BFS
import { parseLevel, isWin, ParsedLevel } from '../src/lib/levels'

const map = [
  '####',
  '# .#',
  '#  ###',
  '#*@  #',
  '#  $ #',
  '#  ###',
  '####',
]

const p = parseLevel(map)
console.log('Initial state:')
console.log('  Player:', p.player)
console.log('  Boxes:', JSON.stringify(getBoxes(p)))
console.log('  Goals:', JSON.stringify(getGoals(p)))
console.log('  Walls:', p.walls.map(r => r.map(w => w ? '#' : '.').join('')).join('\n          '))

interface State {
  player: { x: number; y: number }
  boxes: string[] // sorted "x,y"
}

function getBoxes(p: ParsedLevel): string[] {
  const out: string[] = []
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++)
      if (p.boxes[y][x]) out.push(`${x},${y}`)
  return out.sort()
}

function getGoals(p: ParsedLevel): string[] {
  const out: string[] = []
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++)
      if (p.goals[y][x]) out.push(`${x},${y}`)
  return out.sort()
}

function isGoal(p: ParsedLevel, boxes: Set<string>): boolean {
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++)
      if (p.goals[y][x] && !boxes.has(`${x},${y}`)) return false
  // also: every box must be on a goal
  for (const b of boxes) {
    const [x, y] = b.split(',').map(Number)
    if (!p.goals[y][x]) return false
  }
  return true
}

const dirs = [
  { dx: 0, dy: -1, name: 'up' },
  { dx: 0, dy: 1, name: 'down' },
  { dx: -1, dy: 0, name: 'left' },
  { dx: 1, dy: 0, name: 'right' },
]

const initial: State = { player: p.player, boxes: getBoxes(p) }
const visited = new Set<string>()
const queue: { state: State; path: string[] }[] = [{ state: initial, path: [] }]
visited.add(`${initial.player.x},${initial.player.y}|${initial_boxes(p)}`)

function initial_boxes(p: ParsedLevel): string {
  return getBoxes(p).join(';')
}

let found = false
let solution: string[] = []
let iterations = 0
const maxIter = 100000

while (queue.length > 0 && iterations < maxIter) {
  iterations++
  const { state, path } = queue.shift()!
  const boxSet = new Set(state.boxes)
  if (isGoal(p, boxSet)) {
    found = true
    solution = path
    break
  }

  for (const d of dirs) {
    const nx = state.player.x + d.dx
    const ny = state.player.y + d.dy
    if (nx < 0 || ny < 0 || nx >= p.width || ny >= p.height) continue
    if (p.walls[ny][nx]) continue

    const newBoxes = new Set(boxSet)
    let newPlayer = { x: nx, y: ny }

    if (boxSet.has(`${nx},${ny}`)) {
      // push box
      const bx = nx + d.dx
      const by = ny + d.dy
      if (bx < 0 || by < 0 || bx >= p.width || by >= p.height) continue
      if (p.walls[by][bx]) continue
      if (boxSet.has(`${bx},${by}`)) continue
      newBoxes.delete(`${nx},${ny}`)
      newBoxes.add(`${bx},${by}`)
    }

    const newBoxesArr = [...newBoxes].sort()
    const key = `${newPlayer.x},${newPlayer.y}|${newBoxesArr.join(';')}`
    if (visited.has(key)) continue
    visited.add(key)
    queue.push({ state: { player: newPlayer, boxes: newBoxesArr }, path: [...path, d.name] })
  }
}

console.log('\nSearch results:')
console.log('  Iterations:', iterations)
console.log('  States visited:', visited.size)
console.log('  Solvable:', found)
if (found) {
  console.log('  Solution length:', solution.length, 'moves')
  console.log('  Solution:', solution.join(' '))
}
