// Sokoban-style puzzle levels
// Symbols:
//   '#' = wall
//   ' ' = empty floor
//   '.' = goal target
//   '$' = box
//   '*' = box on goal
//   '@' = player
//   '+' = player on goal

export type Cell = '#' | ' ' | '.' | '$' | '*' | '@' | '+'

export interface Level {
  id: number
  name: string
  difficulty: 'آسان' | 'متوسط' | 'سخت'
  map: string[]
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'شروع',
    difficulty: 'آسان',
    map: [
      '#######',
      '#     #',
      '# .$@ #',
      '#     #',
      '#######',
    ],
  },
  {
    id: 2,
    name: 'دو جعبه',
    difficulty: 'آسان',
    map: [
      '#########',
      '#       #',
      '# .$ $. #',
      '#   @   #',
      '#       #',
      '#########',
    ],
  },
  {
    id: 3,
    name: 'گوشه‌ها',
    difficulty: 'آسان',
    map: [
      '#######',
      '#.    #',
      '# $   #',
      '#  @  #',
      '#   $ #',
      '#    .#',
      '#######',
    ],
  },
  {
    id: 4,
    name: 'راه باریک',
    difficulty: 'متوسط',
    map: [
      '#########',
      '#  .    #',
      '# ###   #',
      '# # $   #',
      '# #  @  #',
      '# # $   #',
      '# ###   #',
      '#  .    #',
      '#########',
    ],
  },
  {
    id: 5,
    name: 'چهار گوشه',
    difficulty: 'متوسط',
    map: [
      '#########',
      '#.     .#',
      '#  $ $  #',
      '#   @   #',
      '#  $ $  #',
      '#.     .#',
      '#########',
    ],
  },
  {
    id: 6,
    name: 'مارپیچ',
    difficulty: 'متوسط',
    map: [
      '##########',
      '#   .    #',
      '# ###### #',
      '# # $  # #',
      '# # @ .# #',
      '# # $  # #',
      '# ###### #',
      '#   .    #',
      '##########',
    ],
  },
  {
    id: 7,
    name: 'جعبه‌های سرکش',
    difficulty: 'متوسط',
    map: [
      '##########',
      '#  .  .  #',
      '# $    $ #',
      '#   @    #',
      '# $    $ #',
      '#  .  .  #',
      '##########',
    ],
  },
  {
    id: 8,
    name: 'انبار',
    difficulty: 'سخت',
    map: [
      '##########',
      '#........#',
      '#        #',
      '# $$$$$$ #',
      '#        #',
      '#   @    #',
      '##########',
    ],
  },
  {
    id: 9,
    name: 'دو راه',
    difficulty: 'سخت',
    map: [
      '##########',
      '#  .     #',
      '#  $#####',
      '#  @ #   #',
      '#  $ # . #',
      '#  . # $ #',
      '#    #   #',
      '######   #',
      '     #####',
    ],
  },
  {
    id: 10,
    name: 'هفت جعبه',
    difficulty: 'سخت',
    map: [
      '##########',
      '#  ....  #',
      '# $    $ #',
      '#  $  $  #',
      '# . @. . #',
      '#  $  $  #',
      '# $    $ #',
      '#  ....  #',
      '##########',
    ],
  },
  {
    id: 11,
    name: 'اتاقک‌ها',
    difficulty: 'سخت',
    map: [
      '###########',
      '#.   #   .#',
      '# $  #  $ #',
      '#  ### ## #',
      '# # $@$ # #',
      '# ### ### #',
      '# $  #  $ #',
      '#.   #   .#',
      '###########',
    ],
  },
  {
    id: 12,
    name: 'استاد',
    difficulty: 'سخت',
    map: [
      '############',
      '#   ....   #',
      '#   ####   #',
      '# $$    $$ #',
      '#  .@  @.  #',  // (will fix below — single player)
      '# $$    $$ #',
      '#   ####   #',
      '#   ....   #',
      '############',
    ],
  },
]

// Fix level 12 (single player only)
LEVELS[11].map = [
  '############',
  '#   ....   #',
  '#   ####   #',
  '# $$    $$ #',
  '#  . @ .   #',
  '# $$    $$ #',
  '#   ####   #',
  '#   ....   #',
  '############',
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
      const c = row[x]
      walls[y].push(c === '#')
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
