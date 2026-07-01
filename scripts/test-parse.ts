// Quick test to verify level 1 parsing
import { parseLevel, isWin } from '../src/lib/levels'

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
console.log('Width:', p.width, 'Height:', p.height)
console.log('Player:', p.player)
console.log('Walls:')
for (let y = 0; y < p.height; y++) {
  console.log('  ', p.walls[y].map(w => w ? '#' : '.').join(''))
}
console.log('Goals:')
for (let y = 0; y < p.height; y++) {
  console.log('  ', p.goals[y].map(g => g ? '.' : ' ').join(''))
}
console.log('Boxes:')
for (let y = 0; y < p.height; y++) {
  console.log('  ', p.boxes[y].map(b => b ? '$' : ' ').join(''))
}
console.log('Initial win?', isWin(p))
