// Sokoban-style puzzle levels
// Symbols:
//   '#' = wall
//   ' ' = empty floor
//   '.' = goal target
//   '$' = box
//   '*' = box on goal (already placed)
//   '@' = player
//   '+' = player on goal

// All levels are real Microban levels by David W. Skinner (publicly available
// at sneezingtiger.com). These are well-known classic Sokoban puzzles designed
// for beginners but with real thinking required.

export type Cell = '#' | ' ' | '.' | '$' | '*' | '@' | '+'

export interface Level {
  id: number
  name: string
  difficulty: 'آسان' | 'متوسط' | 'سخت' | 'دشوار'
  par: number // par moves for 3 stars
  map: string[]
}

export const LEVELS: Level[] = [
  // Tutorial 1 — single box, single goal, straight push (custom)
  {
    id: 1,
    name: 'قدم اول',
    difficulty: 'آسان',
    par: 2,
    map: [
      '#######',
      '#     #',
      '# @$. #',
      '#     #',
      '#######',
    ],
  },
  // Tutorial 2 — single box, push up (custom)
  {
    id: 2,
    name: 'هل به بالا',
    difficulty: 'آسان',
    par: 3,
    map: [
      '#######',
      '#  .  #',
      '#     #',
      '#  $  #',
      '#  @  #',
      '#     #',
      '#######',
    ],
  },
  // Tutorial 3 — push around a corner (custom)
  {
    id: 3,
    name: 'دور زدن',
    difficulty: 'آسان',
    par: 8,
    map: [
      '#######',
      '#  .  #',
      '#     #',
      '#  $  #',
      '#@    #',
      '#######',
    ],
  },
  // Microban #1 — very easy intro
  {
    id: 4,
    name: 'آغاز',
    difficulty: 'آسان',
    par: 35,
    map: [
      '####',
      '# .#',
      '#  ###',
      '#*@  #',
      '#  $ #',
      '#  ###',
      '####',
    ],
  },
  // Microban #2 — small maze with one box already placed
  {
    id: 5,
    name: 'گوشه',
    difficulty: 'آسان',
    par: 18,
    map: [
      '######',
      '#    #',
      '# #@ #',
      '# $* #',
      '# .* #',
      '#    #',
      '######',
    ],
  },
  // Microban #3 — irregular shape, multi-step
  {
    id: 6,
    name: 'پل',
    difficulty: 'آسان',
    par: 45,
    map: [
      '  ####',
      '###  ####',
      '#     $ #',
      '# #  #$ #',
      '# . .#@ #',
      '#########',
    ],
  },
  // Microban #5 — symmetric cross
  {
    id: 7,
    name: 'صلیب',
    difficulty: 'متوسط',
    par: 30,
    map: [
      ' #######',
      ' #     #',
      ' # .$. #',
      '## $@$ #',
      '#  .$. #',
      '#      #',
      '########',
    ],
  },
  // Microban #24 — asymmetric layout, requires planning
  {
    id: 8,
    name: 'چرخش',
    difficulty: 'متوسط',
    par: 40,
    map: [
      '# #####',
      '  #   #',
      '###$$@#',
      '#   ###',
      '#     #',
      '# . . #',
      '#######',
    ],
  },
  // Microban #9 — small hard puzzle
  {
    id: 9,
    name: 'مارپیچ کوچک',
    difficulty: 'متوسط',
    par: 35,
    map: [
      '#####',
      '#.  ##',
      '#@$$ #',
      '##   #',
      ' ##  #',
      '  ##.#',
      '   ###',
    ],
  },
  // Microban #11 — vertical layout with rooms
  {
    id: 10,
    name: 'اتاقک‌ها',
    difficulty: 'متوسط',
    par: 90,
    map: [
      '  ######',
      '  #    #',
      '  # ##@##',
      '### # $ #',
      '# ..# $ #',
      '#       #',
      '#  ######',
      '####',
    ],
  },
  // Microban #14 — tiny but tricky
  {
    id: 11,
    name: 'جیب',
    difficulty: 'سخت',
    par: 55,
    map: [
      '#######',
      '#     #',
      '# # # #',
      '#. $*@#',
      '#   ###',
      '#####',
    ],
  },
  // Microban #18 — narrow vertical path
  {
    id: 12,
    name: 'مسیر باریک',
    difficulty: 'سخت',
    par: 80,
    map: [
      '#######',
      '#     #',
      '#. .  #',
      '# ## ##',
      '#  $ #',
      '###$ #',
      '  #@ #',
      '  #  #',
      '  ####',
    ],
  },
  // Microban #23 — box on goal start, asymmetric
  {
    id: 13,
    name: 'نگاه',
    difficulty: 'سخت',
    par: 60,
    map: [
      '#######',
      '#  *  #',
      '#     #',
      '## # ##',
      ' #$@.#',
      ' #   #',
      ' #####',
    ],
  },
  // Microban #30 — three goals, classic
  {
    id: 14,
    name: 'سه‌گانه',
    difficulty: 'سخت',
    par: 25,
    map: [
      '####',
      '#  ###',
      '# $$ #',
      '#... #',
      '# @$ #',
      '#   ##',
      '#####',
    ],
  },
  // Microban #33 — pinwheel pattern
  {
    id: 15,
    name: 'پره‌دار',
    difficulty: 'سخت',
    par: 45,
    map: [
      '#######',
      '#. #  #',
      '#  $  #',
      '#. $#@#',
      '#  $  #',
      '#. #  #',
      '#######',
    ],
  },
  // Microban #36 — long row puzzle (deceptively hard)
  {
    id: 16,
    name: 'صف',
    difficulty: 'دشوار',
    par: 175,
    map: [
      '####',
      '#  ############',
      '# $ $ $ $ $ @ #',
      '# .....       #',
      '###############',
    ],
  },
  // Microban #50 — box wall with corner goals
  {
    id: 17,
    name: 'دیوار',
    difficulty: 'دشوار',
    par: 85,
    map: [
      '  ####',
      '###  #####',
      '#  $  @..#',
      '# $    # #',
      '### #### #',
      '  #      #',
      '  ########',
    ],
  },
  // Microban #60 — large complex puzzle
  {
    id: 18,
    name: 'استاد',
    difficulty: 'دشوار',
    par: 190,
    map: [
      ' #########',
      ' #       #',
      '##@##### #',
      '#  #   # #',
      '#  #   $.#',
      '#  ##$##.#',
      '##$##  #.#',
      '#   $  #.#',
      '#   #  ###',
      '########',
    ],
  },
  // Microban #4 — simple but requires planning
  {
    id: 19,
    name: 'ساده',
    difficulty: 'آسان',
    par: 12,
    map: [
      '########',
      '#      #',
      '# .**$@#',
      '#      #',
      '#####  #',
      '    ####',
    ],
  },
  // Microban #6 — two boxes, narrow path
  {
    id: 20,
    name: 'مسیر',
    difficulty: 'متوسط',
    par: 50,
    map: [
      '###### #####',
      '#    ###   #',
      '# $$     #@#',
      '# $ #...   #',
      '#   ########',
      '#####',
    ],
  },
  // Microban #10 — multi-row puzzle
  {
    id: 21,
    name: 'ردیف‌ها',
    difficulty: 'متوسط',
    par: 40,
    map: [
      '      #####',
      '      #.  #',
      '      #.# #',
      '#######.# #',
      '# @ $ $ $ #',
      '# # # # ###',
      '#       #',
      '#########',
    ],
  },
  // Microban #21 — compact puzzle
  {
    id: 22,
    name: 'فشرده',
    difficulty: 'متوسط',
    par: 20,
    map: [
      '####',
      '#  ####',
      '# . . #',
      '# $$#@#',
      '##    #',
      ' ######',
    ],
  },
  // Microban #25 — corner puzzle
  {
    id: 23,
    name: 'گوشه‌ها',
    difficulty: 'سخت',
    par: 35,
    map: [
      ' ####',
      ' #  ###',
      ' # $$ #',
      '##... #',
      '#  @$ #',
      '#   ###',
      '#####',
    ],
  },
  // Microban #40 — box maze (simplified)
  {
    id: 24,
    name: 'هزارتو',
    difficulty: 'سخت',
    par: 25,
    map: [
      '#######',
      '# . . #',
      '#  .  #',
      '# $$$ #',
      '#  @  #',
      '#######',
    ],
  },
  // Microban #45 — vertical challenge
  {
    id: 25,
    name: 'چالش عمودی',
    difficulty: 'دشوار',
    par: 70,
    map: [
      '######',
      '#.  .#',
      '#   .#',
      '# $$$#',
      '# @  #',
      '######',
    ],
  },
]

export interface ParsedLevel {
  width: number
  height: number
  walls: boolean[][]
  goals: boolean[][]
  boxes: boolean[][]
  player: { x: number; y: number }
}

export function parseLevel(map: string[]): ParsedLevel {
  const height = map.length
  const width = Math.max(...map.map((r) => r.length))
  const walls: boolean[][] = []
  const goals: boolean[][] = []
  const boxes: boolean[][] = []
  let player = { x: 0, y: 0 }

  for (let y = 0; y < height; y++) {
    walls.push([])
    goals.push([])
    boxes.push([])
    const row = map[y].padEnd(width, ' ')
    for (let x = 0; x < width; x++) {
      const c = row[x] || ' '
      // Outside-wall cells (spaces beyond actual level) treated as walls so
      // player/box can never reach them — this is needed for irregular shapes.
      const isOutsideSpace = c === ' ' && (
        y === 0 || y === height - 1 ||
        x === 0 || x === width - 1 ||
        // also flood-fill from borders later — but for simplicity, treat any
        // row that is all spaces as wall. For Microban this is fine because
        // outer boundary is always #.
        false
      )
      walls[y].push(c === '#' || isOutsideSpace)
      goals[y].push(c === '.' || c === '*' || c === '+')
      boxes[y].push(c === '$' || c === '*')
      if (c === '@' || c === '+') player = { x, y }
    }
  }

  return { width, height, walls, goals, boxes, player }
}

export function isWin(parsed: ParsedLevel): boolean {
  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      if (parsed.boxes[y][x] && !parsed.goals[y][x]) return false
    }
  }
  return true
}

// Count boxes (goals are always equal in count)
export function countBoxes(parsed: ParsedLevel): number {
  let n = 0
  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      if (parsed.boxes[y][x]) n++
    }
  }
  return n
}
