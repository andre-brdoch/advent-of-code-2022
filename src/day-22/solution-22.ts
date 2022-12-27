interface Solution22 {
  answer1: number
}
interface Coordinate {
  x: number
  y: number
}
type Axis = keyof Coordinate
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
  '^': { x: 0, y: -1 },
  '>': { x: 1, y: 0 },
  v: { x: 0, y: 1 },
  '<': { x: -1, y: 0 },
}

export default async function solution(input: string): Promise<Solution22> {
  const { grid, instructions } = parseInput(input)
  let path = [getStartLocation(grid)]
  console.log(stringifyGrid(grid, path))
  path = move(grid, path, 10)
  console.log(stringifyGrid(grid, path))
  rotate(path[path.length - 1], 'R')
  console.log(stringifyGrid(grid, path))
  path = move(grid, path, 5)
  rotate(path[path.length - 1], 'L')
  console.log(stringifyGrid(grid, path))
  path = move(grid, path, 5)
  console.log(stringifyGrid(grid, path))

  return { answer1: 0 }
}

function move(grid: Grid, path: Path, amount: number): Path {
  const newPath = [...path]
  for (let i = 0; i < amount; i++) {
    const next = getNextCoordinate(grid, newPath[newPath.length - 1])
    const cell = grid[next.y][next.x]
    // wall, stop
    if (cell === '#') break
    else if (cell === '.') newPath.push(next)
  }
  return newPath
}

function rotate(
  playerLocation: PlayerLocation,
  rotation: RotateInstruction
): void {
  const { facing } = playerLocation
  const sortedFacings: Facing[] = ['^', '>', 'v', '<']
  const i = sortedFacings.indexOf(facing)
  let iNew = rotation === 'R' ? i + 1 : i - 1
  if (iNew >= sortedFacings.length) iNew = 0
  else if (iNew < 0) iNew = sortedFacings.length - 1
  const newFacing = sortedFacings[iNew]
  playerLocation.facing = newFacing
}

function getNextCoordinate(grid: Grid, location: PlayerLocation) {
  const { facing } = location
  const vector = VECTORS[facing]
  const next = { facing, x: location.x + vector.x, y: location.y + vector.y }
  if (!isOnGrid(grid, next) || grid[next.y][next.x] === ' ') {
    const axis: Axis = ['<', '>'].includes(facing) ? 'x' : 'y'
    const forwards = ['>', 'v'].includes(facing)
    console.log(`axis ${axis}, forwards: ${forwards}`)
    let newVal = location.x
    let isDone = false
    if (axis === 'x' && forwards) {
      while (!isDone) {
        const nextX = newVal - 1
        const newNext = { ...location, x: nextX }
        console.log(`${location.x}/${location.y} --> ${newNext.x}/${newNext.y}`)

        if (!isOnGrid(grid, newNext) || grid[newNext.y][newNext.x] === ' ') {
          isDone = true
          break
        }
        newVal = nextX
      }
      next.x = newVal as number
    }
  }
  return next
}

function isOnGrid(grid: Grid, location: PlayerLocation) {
  try {
    return !!grid[location.y][location.x]
  }
  catch (err) {
    return false
  }
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
  return '\n\n' + gridCopy.map(column => column.join('')).join('\n')
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
