// Verify all 15 levels are solvable
import { LEVELS, parseLevel, ParsedLevel } from '../src/lib/levels'

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
  { dx: 0, dy: -1, name: 'up' },
  { dx: 0, dy: 1, name: 'down' },
  { dx: -1, dy: 0, name: 'left' },
  { dx: 1, dy: 0, name: 'right' },
]

function solve(p: ParsedLevel, timeLimitMs = 30000): { solvable: boolean; moves: number; solution?: string[]; iterations: number } {
  const initial: State = { player: p.player, boxes: getBoxes(p) }
  const visited = new Set<string>()
  const queue: { state: State; path: string[] }[] = [{ state: initial, path: [] }]
  visited.add(`${initial.player.x},${initial.player.y}|${initial.boxes.join(';')}`)

  let iterations = 0
  const maxIter = 2000000
  const startTime = Date.now()

  // Simple deadlock detection: a box pushed into a corner (two adjacent walls forming L) that's not a goal is a deadlock
  function isCornerDeadlock(x: number, y: number): boolean {
    if (p.goals[y][x]) return false
    const wallUp = y === 0 || p.walls[y - 1][x]
    const wallDown = y === p.height - 1 || p.walls[y + 1][x]
    const wallLeft = x === 0 || p.walls[y][x - 1]
    const wallRight = x === p.width - 1 || p.walls[y][x + 1]
    // Only true corners: wall on top AND wall on left/right, OR wall on bottom AND wall on left/right
    if ((wallUp && wallLeft) || (wallUp && wallRight) || (wallDown && wallLeft) || (wallDown && wallRight)) return true
    return false
  }

  while (queue.length > 0 && iterations < maxIter) {
    if (iterations % 10000 === 0 && Date.now() - startTime > timeLimitMs) {
      return { solvable: false, moves: -1, iterations }
    }
    iterations++
    const { state, path } = queue.shift()!
    const boxSet = new Set(state.boxes)
    if (isGoal(p, boxSet)) {
      return { solvable: true, moves: path.length, solution: path, iterations }
    }

    for (const d of dirs) {
      const nx = state.player.x + d.dx
      const ny = state.player.y + d.dy
      if (nx < 0 || ny < 0 || nx >= p.width || ny >= p.height) continue
      if (p.walls[ny][nx]) continue

      const newBoxes = new Set(boxSet)
      let newPlayer = { x: nx, y: ny }

      if (boxSet.has(`${nx},${ny}`)) {
        const bx = nx + d.dx
        const by = ny + d.dy
        if (bx < 0 || by < 0 || bx >= p.width || by >= p.height) continue
        if (p.walls[by][bx]) continue
        if (boxSet.has(`${bx},${by}`)) continue
        // Skip corner deadlocks
        if (isCornerDeadlock(bx, by)) continue
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

console.log('Verifying all 15 levels...')
console.log('ID | Name          | Par | Optimal | Solvable | Iterations')
console.log('---|---------------|-----|---------|----------|-----------')

for (const level of LEVELS) {
  const p = parseLevel(level.map)
  const start = Date.now()
  const result = solve(p, 20000)
  const elapsed = Date.now() - start
  console.log(
    `${String(level.id).padStart(2)} | ${level.name.padEnd(13)} | ${String(level.par).padStart(3)} | ${String(result.moves).padStart(7)} | ${String(result.solvable).padEnd(8)} | ${elapsed}ms (iter: ${result.iterations})`
  )
  if (!result.solvable) {
    console.log(`  WARNING: Level ${level.id} is NOT solvable!`)
  } else if (result.moves > level.par) {
    console.log(`  NOTE: Optimal (${result.moves}) > par (${level.par}). Update par.`)
  }
}
