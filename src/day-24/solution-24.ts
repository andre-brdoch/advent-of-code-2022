interface Solution24 {
  answer1: number
}
interface Coordinate {
  x: number
  y: number
}
type Blizzard = '^' | '>' | 'v' | '<'
type Wall = '#'
type Player = 'E'
type Empty = '.'
type Cell = Blizzard | Blizzard[] | Wall | Player | Empty
type Grid = Cell[][]

export default async function solution(input: string): Promise<Solution24> {
  const grid = parseGrid(input)
  console.log(stringifyGrid(grid))
  moveBlizzards(grid)

  return { answer1: 0 }
}

function moveBlizzards(grid: Grid): Grid {
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      const cell = grid[x][y]
      if (!isBlizzard(cell)) continue
      const cells = ensureArray(cell)
      console.log(cells)
      cells.forEach(c => {
        console.log(c)
      })
    }
  }
  return []
}

function getAdjacentCoordinates(
  grid: Grid,
  coordinate: Coordinate
): Coordinate[] {
  const vectors: Coordinate[] = [-1, 0, 1]
    // get 9 fields
    .flatMap(x => [-1, 0, 1].map(y => ({ x, y })))
    // remove current coordinate
    .filter(({ x, y }) => x !== 0 || y !== 0)
  const neighbors = vectors.map(({ x, y }) => {
    let next: Cell | undefined = undefined
    let nextCoords = coordinate
    // warp through walls
    while (next === undefined || next === '#') {
      nextCoords = {
        x: x + nextCoords.x,
        y: y + nextCoords.y,
      }
      next = grid[nextCoords.x][nextCoords.y]
    }
    return nextCoords
  })
  return neighbors
}

function isBlizzard(cell: Cell): cell is Blizzard {
  if (Array.isArray(cell)) {
    return cell.every(isBlizzard)
  }
  return ['^', '>', 'v', '<'].includes(cell)
}

function stringifyGrid(grid: Grid): string {
  let string = ''
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      const sign = grid[x][y]
      string += sign
    }
    string += '\n'
  }
  return string
}

function ensureArray<T>(item: T | T[]): T[] {
  if (Array.isArray(item)) return item
  return [item]
}

function parseGrid(input: string): Grid {
  return input.split('\n').map(line => line.split('') as Cell[])
}
