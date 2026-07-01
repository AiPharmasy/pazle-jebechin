// Try alternative level 5 candidates
import { parseLevel, ParsedLevel } from '../src/lib/levels'

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

function isCornerDeadlock(p: ParsedLevel, x: number, y: number): boolean {
  if (p.goals[y][x]) return false
  const wallUp = y === 0 || p.walls[y - 1][x]
  const wallDown = y === p.height - 1 || p.walls[y + 1][x]
  const wallLeft = x === 0 || p.walls[y][x - 1]
  const wallRight = x === p.width - 1 || p.walls[y][x + 1]
  if ((wallUp && wallLeft) || (wallUp && wallRight) || (wallDown && wallLeft) || (wallDown && wallRight)) return true
  return false
}

function solve(p: ParsedLevel, timeLimitMs = 30000): { solvable: boolean; moves: number; iterations: number } {
  interface State { player: { x: number; y: number }; boxes: string[] }
  const initial: State = { player: p.player, boxes: getBoxes(p) }
  const visited = new Set<string>()
  const queue: { state: State; path: string[] }[] = [{ state: initial, path: [] }]
  visited.add(`${initial.player.x},${initial.player.y}|${initial.boxes.join(';')}`)
  let iterations = 0
  const startTime = Date.now()

  while (queue.length > 0) {
    if (iterations % 5000 === 0 && Date.now() - startTime > timeLimitMs) {
      return { solvable: false, moves: -1, iterations }
    }
    iterations++
    const { state, path } = queue.shift()!
    const boxSet = new Set(state.boxes)
    if (isGoal(p, boxSet)) return { solvable: true, moves: path.length, iterations }

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

// Try Microban #6, #8, #10, #12, #13, #16, #17, #21, #22, #24, #25, #28, #29, #31, #32 as candidates
const candidates: Record<string, string[]> = {
  'Microban#6': [
    '###### #####',
    '#    ###   #',
    '# $$     #@#',
    '# $ #...   #',
    '#   ########',
    '#####',
  ],
  'Microban#8': [
    '  ######',
    '  # ..@#',
    '  # $$ #',
    '  ## ###',
    '   # #',
    '   # #',
    '#### #',
    '#    ##',
    '# #   #',
    '#   # #',
    '###   #',
    '  #####',
  ],
  'Microban#10': [
    '      #####',
    '      #.  #',
    '      #.# #',
    '#######.# #',
    '# @ $ $ $ #',
    '# # # # ###',
    '#       #',
    '#########',
  ],
  'Microban#12': [
    '#####',
    '#   ##',
    '# $  #',
    '## $ ####',
    ' ###@.  #',
    '  #  .# #',
    '  #     #',
    '  #######',
  ],
  'Microban#13': [
    '####',
    '#. ##',
    '#.@ #',
    '#. $#',
    '##$ ###',
    ' # $  #',
    ' #    #',
    ' #  ###',
    ' ####',
  ],
  'Microban#16': [
    ' ####',
    ' #  ####',
    ' #     ##',
    '## ##   #',
    '#. .# @$##',
    '#   # $$ #',
    '#  .#    #',
    '##########',
  ],
  'Microban#21': [
    '####',
    '#  ####',
    '# . . #',
    '# $$#@#',
    '##    #',
    ' ######',
  ],
  'Microban#24': [
    '# #####',
    '  #   #',
    '###$$@#',
    '#   ###',
    '#     #',
    '# . . #',
    '#######',
  ],
  'Microban#25': [
    ' ####',
    ' #  ###',
    ' # $$ #',
    '##... #',
    '#  @$ #',
    '#   ###',
    '#####',
  ],
}

for (const [name, map] of Object.entries(candidates)) {
  const p = parseLevel(map)
  console.log(`Trying ${name}...`)
  const r = solve(p, 15000)
  console.log(`  solvable=${r.solvable} moves=${r.moves} iter=${r.iterations}`)
}
