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
  '^': { x: 0, y: -1 },
  '>': { x: 1, y: 0 },
  v: { x: 0, y: 1 },
  '<': { x: -1, y: 0 },
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

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x]

      if (!isBlizzard(cell)) continue
      // console.log('----')
      // console.log('before', newGrid)
      const cells = ensureArray(cell)

      cells.forEach(blizzard => {
        const next = getNextCoordinate({ x, y }, blizzard, newGrid)
        const nextCell = newGrid[next.y][next.x]
        // next cell already occupied by blizzard(s)
        if (isBlizzard(nextCell)) {
          newGrid[next.y][next.x] = [...ensureArray(nextCell), blizzard]
        }
        else newGrid[next.y][next.x] = blizzard
      })
      // console.log('after', newGrid)
    }
  }
  return newGrid
}

function getNextCoordinate(
  coordinate: Coordinate,
  blizzard: Blizzard,
  grid: Grid
): Coordinate {
  let nextCell: Cell | undefined = undefined
  let next = { ...coordinate }
  const vector = VECTORS[blizzard]
  while (nextCell === undefined || nextCell === '#') {
    next = {
      x: vector.x + next.x,
      y: vector.y + next.y,
    }

    nextCell = grid[next.y][next.x]
    // console.log('blizzard', blizzard)
    // console.log('coordinate', coordinate)
    // console.log('vector', vector)
    // console.log('result', next)
    // console.log('next', nextCell)

    // warp through walls
    if (nextCell === '#') {
      console.log('is a wall!!')

      const axis = ['<', '>'].includes(blizzard) ? 'x' : 'y'
      console.log('axis', axis)

      const forwards = ['>', 'v'].includes(blizzard)
      if (forwards) next[axis] = 0
      else {
        if (axis === 'y') next[axis] = grid.length - 1
        else next[axis] = grid[0].length - 1
      }
    }
  }
  return next
}

// function getAdjacentCoordinates(
//   grid: Grid,
//   coordinate: Coordinate
// ): Coordinate[] {
//   const vectors: Coordinate[] = [-1, 0, 1]
//     // get 9 fields
//     .flatMap(x => [-1, 0, 1].map(y => ({ x, y })))
//     // remove current coordinate
//     .filter(({ x, y }) => x !== 0 || y !== 0)
//   const neighbors = vectors.map(({ x, y }) => {
//     let next: Cell | undefined = undefined
//     let nextCoords = coordinate
//     // warp through walls
//     while (next === undefined || next === '#') {
//       nextCoords = {
//         x: x + nextCoords.x,
//         y: y + nextCoords.y,
//       }
//       next = grid[nextCoords.x][nextCoords.y]
//     }
//     return nextCoords
//   })
//   return neighbors
// }

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
