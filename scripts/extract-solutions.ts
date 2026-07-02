// Verify all levels are solvable + extract solutions
import { LEVELS, parseLevel, ParsedLevel } from '../src/lib/levels'
import * as fs from 'fs'

interface State {
  player: { x: number; y: number }
  boxes: string[]
}

function getBoxes(p: ParsedLevel): string[] {
  const out: string[] = []
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++)
      if (p.boxes[y][x]) out.push(`${x},${y}`)
  return out.sort()
}

function isGoal(p: ParsedLevel, boxes: Set<string>): boolean {
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++)
      if (p.goals[y][x] && !boxes.has(`${x},${y}`)) return false
  for (const b of boxes) {
    const [x, y] = b.split(',').map(Number)
    if (!p.goals[y][x]) return false
  }
  return true
}

const dirs = [
  { dx: 0, dy: -1, name: 'up', ch: 'u' },
  { dx: 0, dy: 1, name: 'down', ch: 'd' },
  { dx: -1, dy: 0, name: 'left', ch: 'l' },
  { dx: 1, dy: 0, name: 'right', ch: 'r' },
]

function isCornerDeadlock(p: ParsedLevel, x: number, y: number): boolean {
  if (p.goals[y][x]) return false
  const wallUp = y === 0 || p.walls[y - 1][x]
  const wallDown = y === p.height - 1 || p.walls[y + 1][x]
  const wallLeft = x === 0 || p.walls[y][x - 1]
  const wallRight = x === p.width - 1 || p.walls[y][x + 1]
  if ((wallUp && wallLeft) || (wallUp && wallRight) || (wallDown && wallLeft) || (wallDown && wallRight)) return true
  return false
}

function solve(p: ParsedLevel, timeLimitMs = 30000): { solvable: boolean; moves: number; solution?: string[]; iterations: number } {
  interface State { player: { x: number; y: number }; boxes: string[] }
  const initial: State = { player: p.player, boxes: getBoxes(p) }
  const visited = new Set<string>()
  const queue: { state: State; path: string[] }[] = [{ state: initial, path: [] }]
  visited.add(`${initial.player.x},${initial.player.y}|${initial.boxes.join(';')}`)
  let iterations = 0
  const startTime = Date.now()

  while (queue.length > 0) {
    if (iterations % 10000 === 0 && Date.now() - startTime > timeLimitMs) {
      return { solvable: false, moves: -1, iterations }
    }
    iterations++
    const { state, path } = queue.shift()!
    const boxSet = new Set(state.boxes)
    if (isGoal(p, boxSet)) return { solvable: true, moves: path.length, solution: path, iterations }

    for (const d of dirs) {
      const nx = state.player.x + d.dx
      const ny = state.player.y + d.dy
      if (nx < 0 || ny < 0 || nx >= p.width || ny >= p.height) continue
      if (p.walls[ny][nx]) continue
      const newBoxes = new Set(boxSet)
      const newPlayer = { x: nx, y: ny }
      if (boxSet.has(`${nx},${ny}`)) {
        const bx = nx + d.dx
        const by = ny + d.dy
        if (bx < 0 || by < 0 || bx >= p.width || by >= p.height) continue
        if (p.walls[by][bx]) continue
        if (boxSet.has(`${bx},${by}`)) continue
        if (isCornerDeadlock(p, bx, by)) continue
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
  return { solvable: false, moves: -1, iterations }
}

const results: any[] = []

console.log('Verifying all 25 levels...')
console.log('ID | Name          | Par | Optimal | Solvable | Iterations')
console.log('---|---------------|-----|---------|----------|-----------')

for (const level of LEVELS) {
  const p = parseLevel(level.map)
  const start = Date.now()
  const result = solve(p, 30000)
  const elapsed = Date.now() - start
  console.log(
    `${String(level.id).padStart(2)} | ${level.name.padEnd(13)} | ${String(level.par).padStart(3)} | ${String(result.moves).padStart(7)} | ${String(result.solvable).padEnd(8)} | ${elapsed}ms (iter: ${result.iterations})`
  )

  let lurd = ''
  if (result.solution) {
    let player = p.player
    const boxes = new Set(getBoxes(p))
    for (const move of result.solution) {
      const d = dirs.find(dd => dd.name === move)!
      const nx = player.x + d.dx
      const ny = player.y + d.dy
      const isPush = boxes.has(`${nx},${ny}`)
      lurd += isPush ? d.ch.toUpperCase() : d.ch
      if (isPush) {
        const bx = nx + d.dx
        const by = ny + d.dy
        boxes.delete(`${nx},${ny}`)
        boxes.add(`${bx},${by}`)
      }
      player = { x: nx, y: ny }
    }
  }

  results.push({
    id: level.id,
    name: level.name,
    difficulty: level.difficulty,
    par: level.par,
    optimal: result.moves,
    solvable: result.solvable,
    iterations: result.iterations,
    elapsedMs: elapsed,
    solution_lurd: lurd,
    solution_readable: result.solution?.join(' ') || '',
  })
}

fs.writeFileSync(
  '/home/z/my-project/download/solutions.json',
  JSON.stringify(results, null, 2)
)

console.log('\nDetailed solutions saved to /home/z/my-project/download/solutions.json')
console.log('\n=== Summary ===')
const solvableCount = results.filter(r => r.solvable).length
console.log(`Solvable: ${solvableCount}/${LEVELS.length}`)
if (solvableCount < LEVELS.length) {
  console.log('UNSOLVABLE LEVELS:')
  results.filter(r => !r.solvable).forEach(r => {
    console.log(`  Level ${r.id} (${r.name})`)
  })
}
