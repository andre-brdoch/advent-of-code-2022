import { Logger } from '../utils/Logger.js'
import { parseArgs } from '../utils/env-helpers.js'
import { getFoldedDie } from './fold-die.js'
import {
  isOnGrid,
  getStartLocation,
  stringifyGrid,
  stringifyInstructions,
  parseInput,
} from './utils.js'
import { VECTORS } from './constants.js'
import {
  Solution22,
  Axis,
  Facing,
  PlayerLocation,
  Path,
  Grid,
  RotateInstruction,
  MoveInstruction,
  Instruction,
} from './types'

const { file } = parseArgs()

const logger = new Logger()

export default async function solution(input: string): Promise<Solution22> {
  const { grid, instructions } = parseInput(input)
  const path = getPathFromInstructions(grid, instructions)
  const answer1 = getPassword(grid, path[path.length - 1])

  getFoldedDie(grid)
  // console.log('planes')
  // console.log(planes)
  // console.log('edges')
  // console.log(edges)
  // const planesGrid = planesToGrid(planes)
  // console.log('planesGrid')
  // console.log(planesGrid)

  // connectEdges(planes, edges)

  // console.log(stringifyPlanes(planes))

  return {
    answer1,
    ...logger.getVisual(file?.replace('input', 'output') ?? 'output.txt'),
  }
}

function getPassword(grid: Grid, location: PlayerLocation): number {
  const { x, y, facing } = location
  const faceValue = {
    '>': 0,
    "v": 1,
    '<': 2,
    '^': 3,
  }
  return 1000 * (grid.length - y) + 4 * (x + 1) + faceValue[facing]
}

function getPathFromInstructions(
  grid: Grid,
  instructions: Instruction[]
): Path {
  let path = [getStartLocation(grid)]
  logger.log('===== Start position =====')
  // logger.log(stringifyGrid(grid, path))

  instructions.forEach((instruction, i) => {
    if (typeof instruction === 'number') {
      // movement
      path = move(grid, path, instruction)

      if (i === instructions.length - 1) {
        // logger.log(stringifyInstructions(instruction))
        // logger.log(stringifyGrid(grid, path))
      }
    }
    else {
      // rotate last
      rotate(path[path.length - 1], instruction)

      // logger.log(
      //   stringifyInstructions(
      //     instructions[i - 1] as MoveInstruction,
      //     instruction
      //   )
      // )
      // logger.log(stringifyGrid(grid, path))
    }
  })
  return path
}

function move(grid: Grid, path: Path, amount: number): Path {
  const newPath = [...path]
  for (let i = 0; i < amount; i++) {
    const last = newPath[newPath.length - 1]
    const next = getNextCoordinate(grid, last)
    const cell = grid[next.y][next.x]
    // wall, stop
    if (cell.type === '#') break
    else newPath.push(next)
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
    const forwards = ['>', '^'].includes(facing)
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
