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

const VECTORS = {
  '^': { x: -1, y: 0 },
  '>': { x: 0, y: 1 },
  v: { x: 1, y: 0 },
  '<': { x: 0, y: -1 },
}

export default async function solution(input: string): Promise<Solution24> {
  let grid = parseGrid(input)
  console.log(stringifyGrid(grid))
  grid = moveBlizzards(grid)
  console.log(stringifyGrid(grid))
  grid = moveBlizzards(grid)
  console.log(stringifyGrid(grid))
  grid = moveBlizzards(grid)
  console.log(stringifyGrid(grid))
  grid = moveBlizzards(grid)
  console.log(stringifyGrid(grid))
  grid = moveBlizzards(grid)
  console.log(stringifyGrid(grid))

  return { answer1: 0 }
}

function moveBlizzards(grid: Grid): Grid {
  const newGrid: Grid = grid
    .slice()
    .map(row => row.slice().map(cell => (isBlizzard(cell) ? '.' : cell)))

  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      const cell = grid[x][y]
      if (!isBlizzard(cell)) continue
      const cells = ensureArray(cell)
      cells.forEach(blizzard => {
        const next = getNextCoordinate({ x, y }, blizzard, newGrid)
        const nextCell = newGrid[next.x][next.y]
        // next cell already occupied by blizzard(s)
        if (isBlizzard(nextCell)) {
          newGrid[next.x][next.y] = [...ensureArray(nextCell), blizzard]
        }
        else newGrid[next.x][next.y] = blizzard
      })
    }
  }
  return newGrid
}

function getNextCoordinate(
  coordinate: Coordinate,
  blizzard: Blizzard,
  grid: Grid
): Coordinate {
  let next: Cell | undefined = undefined
  let result = { ...coordinate }
  const vector = VECTORS[blizzard]
  while (next === undefined || next === '#') {
    result = {
      x: vector.x + result.x,
      y: vector.y + result.y,
    }
    next = grid[result.x][result.y]

    // warp through walls
    if (next === '#') {
      const axis = ['<', '>'].includes(blizzard) ? 'y' : 'x'
      const forwards = ['>', 'v'].includes(blizzard)
      if (forwards) result[axis] = 0
      else {
        if (axis === 'x') result[axis] = grid.length - 1
        else result[axis] = grid[0].length
      }
    }
  }
  return result
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
      let sign: Cell | number = grid[x][y]
      if (Array.isArray(sign)) sign = sign.length
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
