import { Logger } from '../utils/Logger.js'
import { Die } from './fold-die.js'
import {
  isOnGrid,
  getStartLocation,
  parseInput,
  getAxis,
  isForward,
  stringifyInstructions,
  stringifyGrid,
} from './utils.js'
import { VECTORS } from './constants.js'
import { SolutionFn } from '../types'
import {
  Facing,
  PlayerLocation,
  Path,
  Grid,
  RotateInstruction,
  Instruction,
  MoveInstruction,
} from './types'

const loggers = [
  new Logger({ outputName: 'output-1.txt' }),
  new Logger({ outputName: 'output-2.txt' }),
]
let logger = loggers[0]

export default (async function solution(input) {
  const answer1 = getAnswer1(input)
  logger = loggers[1]
  const answer2 = getAnswer2(input)

  return {
    answer1,
    answer2,
    visuals: loggers.map(l => l.getVisual()),
  }
} satisfies SolutionFn)

function getAnswer1(input: string): number {
  const { grid, instructions } = parseInput(input)
  const path = getPathFromInstructions(grid, instructions)
  return getPassword(grid, path[path.length - 1])
}

function getAnswer2(input: string): number {
  const { grid, instructions } = parseInput(input)
  const die = new Die(grid)
  const path = getPathFromInstructions(grid, instructions, die)
  return getPassword(grid, path[path.length - 1])
}

function getPassword(grid: Grid, location: PlayerLocation): number {
  const { x, y, facing } = location
  const faceValue = {
    '>': 0,
    'v': 1,
    '<': 2,
    '^': 3,
  }
  return 1000 * (grid.length - y) + 4 * (x + 1) + faceValue[facing]
}

function getPathFromInstructions(
  grid: Grid,
  instructions: Instruction[],
  die?: Die
): Path {
  let path = [getStartLocation(grid)]
  logger.log(`===== Start position =====\n${stringifyGrid(grid, path)}`)

  instructions.forEach((instruction, i) => {
    if (typeof instruction === 'number') {
      // movement
      path = move(grid, path, instruction, die)

      if (i === instructions.length - 1) {
        logger.log(
          `${stringifyInstructions(instruction)}\n${stringifyGrid(grid, path)}`
        )
      }
    }
    else {
      // rotate last
      rotate(path[path.length - 1], instruction)

      logger.log(
        `${stringifyInstructions(
          instructions[i - 1] as MoveInstruction,
          instruction
        )}\n${stringifyGrid(grid, path)}`
      )
    }
  })
  return path
}

function move(grid: Grid, path: Path, amount: number, die?: Die): Path {
  const newPath = [...path]
  for (let i = 0; i < amount; i++) {
    const last = newPath[newPath.length - 1]
    const next = getNextCoordinate(grid, last, die)
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

function getNextCoordinate(
  grid: Grid,
  location: PlayerLocation,
  die?: Die
): PlayerLocation {
  const { facing } = location
  const vector = VECTORS[facing]
  const next = { facing, x: location.x + vector.x, y: location.y + vector.y }
  // warp through empty space
  if (!isOnGrid(grid, next) || grid[next.y][next.x].type === ' ') {
    // warp to opposite side
    if (!die) {
      const axis = getAxis(facing)
      const forwards = isForward(facing)
      let newVal = location[axis]
      // follow the axis back until the first field before empty space
      while (true) {
        const nextVal = newVal + (forwards ? -1 : 1)
        const newNext = { ...location, [axis]: nextVal }
        if (
          !isOnGrid(grid, newNext) ||
          grid[newNext.y][newNext.x].type === ' '
        ) {
          break
        }
        newVal = nextVal
      }
      next[axis] = newVal as number
    }

    // warp around die edge
    else {
      return die.moveOverEdge(location)
    }
  }
  return next
}
