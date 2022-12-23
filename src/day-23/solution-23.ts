interface Solution23 {
  answer1: number
}
interface Coordinate {
  x: number
  y: number
}
type MainDirections = 'N' | 'S' | 'E' | 'W'
type Direction = 'N' | 'S' | 'E' | 'W' | 'NW' | 'NE' | 'SW' | 'SE'
interface Vector extends Coordinate {
  name: Direction
}
interface Elf {
  moveTo?: Coordinate
  name: string
}
// map to look up elfs via y/x coordinates
interface Grid {
  [key: string]: {
    [key: string]: Elf
  }
}

export default async function solution(input: string): Promise<Solution23> {
  console.log(input)

  const grid = parseFile(input)
  console.log(grid)
  console.log(getAdjacent(grid, { x: 2, y: 2 }, 'E'))

  return { answer1: 0 }
}

const VECTORS = {
  N: { x: 0, y: 1 },
  NE: { x: 1, y: 1 },
  E: { x: 1, y: 0 },
  SE: { x: 1, y: -1 },
  S: { x: 0, y: -1 },
  SW: { x: -1, y: -1 },
  W: { x: -1, y: 0 },
  NW: { x: -1, y: 1 },
}
const DIRECTION_ARCS = {
  N: [VECTORS.NE, VECTORS.N, VECTORS.NW],
  W: [VECTORS.NW, VECTORS.W, VECTORS.SW],
  S: [VECTORS.SW, VECTORS.S, VECTORS.SE],
  E: [VECTORS.NE, VECTORS.E, VECTORS.SE],
}

function moveElves(grid: Grid, elves: Elf[]): void {
  elves.filter(elf => elf)
  // find elves /w adjacent elves
}

function getAdjacent(
  grid: Grid,
  coordinate: Coordinate,
  direction: MainDirections | 'all'
): Elf[] {
  const { x, y } = coordinate
  const directions =
    direction !== 'all'
      ? DIRECTION_ARCS[direction]
      : Object.keys(VECTORS).map(key => VECTORS[key as Direction])
  return directions
    .map(vector => ({
      x: x + vector.x,
      y: y + vector.y,
    }))
    .map(c => grid[c.y]?.[c.x])
}

function parseFile(input: string): Grid {
  const grid: Grid = {}
  const elves: Elf[] = []

  input.split('\n').forEach((line, y) =>
    line.split('').forEach((char, x) => {
      if (char === '.') return
      const elf: Elf = { name: `#${x}/${y}` }
      elves.push(elf)

      if (!(y in grid)) {
        grid[y] = { [x]: elf }
      }
      else {
        grid[y][x] = elf
      }
    })
  )
  return grid
}
