import { Logger } from '../utils/Logger.js'
import { parseArgs } from '../utils/env-helpers.js'
import {
  Solution22,
  Coordinate,
  Axis,
  Facing,
  PlayerLocation,
  Path,
  Cell,
  Grid,
  RotateInstruction,
  MoveInstruction,
  Instruction,
  Plane,
  PlaneEdge,
} from './types'

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
  console.log('planes')
  console.log(planes)
  // console.log('edges')
  // console.log(edges)
  const planesGrid = planesToGrid(planes)
  console.log('planesGrid')
  console.log(planesGrid)

  // connectEdges(planes, edges)

  console.log(stringifyPlanes(planes))

  return {
    answer1,
    ...logger.getVisual(file?.replace('input', 'output') ?? 'output.txt'),
  }
}

function connectEdges(planes: Plane[], edges: PlaneEdge[]): any {
  //
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
        const plane = {} as Plane
        plane.name = name.toString()
        plane.x = x
        plane.y = y
        plane.z = 0
        plane.edges = {
          '^': {
            from: { x: 0 + x, y: 0 + y },
            to: { x: 1 + x, y: 0 + y },
            planes: [plane],
          },
          '>': {
            from: { x: 1 + x, y: 0 + y },
            to: { x: 1 + x, y: 1 + y },
            planes: [plane],
          },
          "v": {
            from: { x: 0 + x, y: 1 + y },
            to: { x: 1 + x, y: 1 + y },
            planes: [plane],
          },
          '<': {
            from: { x: 0 + x, y: 0 + y },
            to: { x: 0 + x, y: 1 + y },
            planes: [plane],
          },
        }
        planes.push(plane)

        name += 1
      }
    }
  }

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
