import { Logger } from '../utils/Logger.js'
import { parseArgs } from '../utils/env-helpers.js'

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
interface Cell {
  type: '.' | '#' | ' ' | Facing
}
type Grid = Cell[][]
type RotateInstruction = 'L' | 'R'
type MoveInstruction = number
type Instruction = MoveInstruction | RotateInstruction
interface PlaneEdge {
  // todo: switch to Plane
  toPlane: string
  toEdge: 'a' | 'b' | 'c' | 'd'
}
interface Plane {
  name: string
  edgeA: PlaneEdge | undefined
  edgeB: PlaneEdge | undefined
  edgeC: PlaneEdge | undefined
  edgeD: PlaneEdge | undefined
  x: number
  y: number
}

const { isTest, file } = parseArgs()

const INITIAL_FACING = '>'

const VECTORS: { [facing: string]: Coordinate } = {
  '^': { x: 0, y: -1 },
  '>': { x: 1, y: 0 },
  "v": { x: 0, y: 1 },
  '<': { x: -1, y: 0 },
}

const PLANE_SIZE = isTest ? 4 : 50

const logger = new Logger()

export default async function solution(input: string): Promise<Solution22> {
  const { grid, instructions } = parseInput(input)
  const path = getPathFromInstructions(grid, instructions)
  const answer1 = getPassword(path[path.length - 1])

  const planes = getPlanes(grid)
  console.log(planes)
  console.log(stringifyPlanes(planes))

  return {
    answer1,
    ...logger.getVisual(file?.replace('input', 'output') ?? 'output.txt'),
  }
}

function getPlanes(grid: Grid): Plane[] {
  const planes: Plane[] = []
  let name = 1
  // unfolded die must fit into a 4x4 grid
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      // is plane if not empty
      if (
        isOnGrid(grid, {
          x: x * PLANE_SIZE,
          y: y * PLANE_SIZE,
        }) &&
        grid[y * PLANE_SIZE][x * PLANE_SIZE].type !== ' '
      ) {
        const plane: Plane = {
          name: name.toString(),
          x,
          y,
          edgeA: undefined,
          edgeB: undefined,
          edgeC: undefined,
          edgeD: undefined,
        }
        planes.push(plane)

        name += 1
      }
    }
  }

  const planeGrid = planesToGrid(planes)
  planes.forEach(plane => {
    const rightCoordinate = { y: plane.y, x: plane.x + 1 }
    const topCoordinate = { y: plane.y + 1, x: plane.x }
    const rightNeighbor = isOnGrid(planeGrid, rightCoordinate)
      ? planeGrid[rightCoordinate.y][rightCoordinate.x]
      : null
    const topNeighbor = isOnGrid(planeGrid, topCoordinate)
      ? planeGrid[topCoordinate.y][topCoordinate.x]
      : null
    if (plane.edgeB === undefined && rightNeighbor) {
      plane.edgeB = {
        toPlane: rightNeighbor.name,
        toEdge: 'd',
      }
      rightNeighbor.edgeD = {
        toPlane: plane.name,
        toEdge: 'b',
      }
    }
    if (plane.edgeA === undefined && topNeighbor) {
      plane.edgeB = {
        toPlane: topNeighbor.name,
        toEdge: 'c',
      }
      topNeighbor.edgeC = {
        toPlane: plane.name,
        toEdge: 'a',
      }
    }
  })
  return planes
}

function getPassword(location: PlayerLocation): number {
  const { x, y, facing } = location
  const faceValue = {
    '>': 0,
    "v": 1,
    '<': 2,
    '^': 3,
  }
  return 1000 * (y + 1) + 4 * (x + 1) + faceValue[facing]
}

function getPathFromInstructions(
  grid: Grid,
  instructions: Instruction[]
): Path {
  let path = [getStartLocation(grid)]
  logger.log('===== Start position =====')
  logger.log(stringifyGrid(grid, path))

  instructions.forEach((instruction, i) => {
    if (typeof instruction === 'number') {
      // movement
      path = move(grid, path, instruction)

      if (i === instructions.length - 1) {
        logger.log(stringifyInstructions(instruction))
        logger.log(stringifyGrid(grid, path))
      }
    }
    else {
      // rotate last
      rotate(path[path.length - 1], instruction)

      logger.log(
        stringifyInstructions(
          instructions[i - 1] as MoveInstruction,
          instruction
        )
      )
      logger.log(stringifyGrid(grid, path))
    }
  })
  return path
}

function move(grid: Grid, path: Path, amount: number): Path {
  const newPath = [...path]
  for (let i = 0; i < amount; i++) {
    const next = getNextCoordinate(grid, newPath[newPath.length - 1])
    const cell = grid[next.y][next.x]
    // wall, stop
    if (cell.type === '#') break
    else if (cell.type === '.') newPath.push(next)
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
  // warp through empty space
  if (!isOnGrid(grid, next) || grid[next.y][next.x].type === ' ') {
    const axis: Axis = ['<', '>'].includes(facing) ? 'x' : 'y'
    const forwards = ['>', 'v'].includes(facing)
    let newVal = location[axis]
    // follow the axis back until the first field before empty space
    while (true) {
      const nextVal = newVal + (forwards ? -1 : 1)
      const newNext = { ...location, [axis]: nextVal }
      if (!isOnGrid(grid, newNext) || grid[newNext.y][newNext.x].type === ' ') {
        break
      }
      newVal = nextVal
    }
    next[axis] = newVal as number
  }
  return next
}

function isOnGrid<T>(grid: T[][], coordinate: Coordinate) {
  try {
    return !!grid[coordinate.y][coordinate.x]
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
      if (cell.type === '.') break outer
    }
  }
  return { x, y, facing: INITIAL_FACING }
}

function planesToGrid(planes: Plane[]): (Plane | null)[][] {
  const planeGrid = []
  for (let y = 0; y < 4; y++) {
    const row = []
    for (let x = 0; x < 4; x++) {
      const plane = planes.find(p => p.x === x && p.y === y)
      if (plane) row.push(plane)
      else row.push(null)
    }
    planeGrid.push(row)
  }
  return planeGrid
}

function stringifyPlanes(planes: Plane[]): string {
  const planeGrid = planesToGrid(planes)
  return planeGrid
    .map(row => row.map(plane => plane?.name ?? ' ').join(' '))
    .join('\n')
}

function stringifyGrid(grid: Grid, path: Path): string {
  const gridCopy = grid.slice().map(column => column.slice())
  path.forEach(player => {
    gridCopy[player.y][player.x].type = player.facing
  })
  return (
    '\n\n' +
    gridCopy.map(column => column.map(cell => cell.type).join('')).join('\n')
  )
}

function stringifyInstructions(
  moveInstruction: MoveInstruction,
  rotateInstruction: RotateInstruction | undefined = undefined
): string {
  let str = `Move ${moveInstruction}`
  if (rotateInstruction) {
    str += `, rotate to the ${rotateInstruction === 'R' ? 'right' : 'left'}`
  }
  return `\n\n===== ${str} =====`
}

function parseInput(input: string): {
  grid: Grid
  instructions: Instruction[]
} {
  const [mapString, instructionString] = input.split('\n\n')
  const grid: Grid = mapString
    .split('\n')
    .map(line => line.split('').map(sign => ({ type: sign })) as Cell[])
  let instructions: Instruction[] = []
  for (let i = 0; i < instructionString.length; i++) {
    const char = instructionString.charAt(i)
    const digit = parseInt(char, 10)
    if (!isNaN(digit)) instructions.push(digit)
    else instructions.push(char as RotateInstruction)
  }
  instructions = instructions.reduce((result, item, i) => {
    // current and last signs were digits -> merge them
    if (
      i > 0 &&
      [item, result[result.length - 1]].every(el => typeof el === 'number')
    ) {
      return [
        ...result.slice(0, result.length - 1),
        Number(`${result[result.length - 1]}${item}`),
      ]
    }
    return [...result, item]
  }, [] as Instruction[])
  return { grid, instructions }
}
