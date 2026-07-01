import { LEVELS, parseLevel } from '../src/lib/levels'

const level = LEVELS.find(l => l.id === 5)!
const p = parseLevel(level.map)
console.log('Level 5 map:')
level.map.forEach((r, i) => console.log(`  ${i}: "${r}"`))
console.log('\nWidth:', p.width, 'Height:', p.height)
console.log('Player:', p.player)
console.log('\nWalls:')
for (let y = 0; y < p.height; y++) {
  console.log('  ', p.walls[y].map(w => w ? '#' : '.').join(''))
}
console.log('\nGoals:')
for (let y = 0; y < p.height; y++) {
  console.log('  ', p.goals[y].map(g => g ? '.' : ' ').join(''))
}
console.log('\nBoxes:')
for (let y = 0; y < p.height; y++) {
  console.log('  ', p.boxes[y].map(b => b ? '$' : ' ').join(''))
}
