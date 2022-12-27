interface Solution22 {
  answer1: number
}
interface Coordinate {
  x: number
  y: number
}
type Facing = '^' | '>' | 'v' | '<'
interface PlayerLocation extends Coordinate {
  facing: Facing
}
type Path = PlayerLocation[]
type Cell = '.' | '#' | ' ' | Facing
type Grid = Cell[][]
type RotateInstruction = 'L' | 'R'
type Instruction = number | RotateInstruction

const INITIAL_FACING = '>'

const VECTORS: { [facing: string]: Coordinate } = {
  '^': { x: 0, y: 1 },
  '>': { x: 1, y: 0 },
  v: { x: 0, y: -1 },
  '<': { x: -1, y: 0 },
}

export default async function solution(input: string): Promise<Solution22> {
  const { grid, instructions } = parseInput(input)
  let path = [getStartLocation(grid)]
  console.log(stringifyGrid(grid, path))
  path = move(grid, path, 10)
  console.log(stringifyGrid(grid, path))

  // console.log(player)
  // console.log('\nnext:')
  // const c = getNextCoordinate(grid, { ...player, x: player.x + 2 })
  // console.log(c)
  // console.log(grid[c.y][c.x])

  return { answer1: 0 }
}

function move(grid: Grid, path: Path, amount: number): Path {
  const newPath = [...path]
  console.log(newPath)

  for (let i = 0; i < amount; i++) {
    const next = getNextCoordinate(grid, newPath[newPath.length - 1])
    console.log(next)
    const cell = grid[next.y][next.x]
    // wall, stop
    if (cell === '#') break
    else if (cell === '.') newPath.push(next)
  }
  return newPath
}

function getNextCoordinate(grid: Grid, location: PlayerLocation) {
  const { facing } = location
  const vector = VECTORS[facing]
  const next = { facing, x: location.x + vector.x, y: location.y + vector.y }
  if (grid[next.y][next.x] === ' ') {
    // todo: empty, warp
  }
  return next
}

function getStartLocation(grid: Grid): PlayerLocation {
  let x = 0
  let y = 0
  outer: for (; y < grid.length; y++) {
    for (; x < grid[y].length; x++) {
      const cell = grid[y][x]
      if (cell === '.') break outer
    }
  }
  return { x, y, facing: INITIAL_FACING }
}

function stringifyGrid(grid: Grid, path: Path): string {
  const gridCopy = grid.slice().map(column => column.slice())
  path.forEach(player => {
    gridCopy[player.y][player.x] = player.facing
  })
  return gridCopy.map(column => column.join('')).join('\n')
}

function parseInput(input: string): {
  grid: Grid
  instructions: Instruction[]
} {
  const [mapString, instructionString] = input.split('\n\n')
  const grid: Grid = mapString.split('\n').map(line => line.split('') as Cell[])
  let instructions: Instruction[] = []
  for (let i = 0; i < instructionString.length; i++) {
    const char = instructionString.charAt(i)
    const digit = parseInt(char)
    if (!isNaN(digit)) instructions.push(digit)
    else instructions.push(char as RotateInstruction)
  }
  instructions = instructions.reduce((result, item, i) => {
    // current and last signs were digits -> merge them
    if (i > 0 && [item, result[i - 1]].every(el => typeof el === 'number')) {
      return [
        ...result.slice(0, result.length - 1),
        Number(`${result[i - 1]}${item}`),
      ]
    }
    return [...result, item]
  }, [] as Instruction[])
  return { grid, instructions }
}
