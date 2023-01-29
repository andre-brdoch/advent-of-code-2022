import { INITIAL_FACING } from './constants.js'
import {
  Coordinate,
  PlayerLocation,
  Grid,
  Cell,
  Plane,
  Path,
  Instruction,
  MoveInstruction,
  RotateInstruction,
  Coordinate3D,
} from './types'

export function coordinatesOverlap(
  a: Coordinate | Coordinate3D,
  b: Coordinate | Coordinate3D
) {
  const are3D = coordinateIs3D(a) && coordinateIs3D(b)
  return (
    a.x === b.x &&
    a.y === b.y &&
    // if 3D, check also z-axis
    (are3D ? a.z === b.z : true)
  )
}

export function coordinateIs3D(
  coordinate: Coordinate | Coordinate3D
): coordinate is Coordinate3D {
  return 'z' in coordinate
}

export function isOnGrid<T>(grid: T[][], coordinate: Coordinate) {
  try {
    return !!grid[coordinate.y][coordinate.x]
  }
  catch (err) {
    return false
  }
}

export function getStartLocation(grid: Grid): PlayerLocation {
  let x = 0
  let y = grid.length - 1
  outer: for (; y >= 0; y--) {
    for (; x < grid[y].length; x++) {
      const cell = grid[y][x]
      if (cell.type === '.') break outer
    }
  }
  return { x, y, facing: INITIAL_FACING }
}

export function planesToGrid(planes: Plane[]): (Plane | null)[][] {
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

export function stringifyPlanes(planes: Plane[]): string {
  const planeGrid = planesToGrid(planes)
  return planeGrid
    .map(row => row.map(plane => plane?.name ?? ' ').join(' '))
    .join('\n')
}

export function stringifyGrid(grid: Grid, path: Path): string {
  const gridCopy = grid.slice().map(column => column.slice())
  path.forEach(player => {
    gridCopy[player.y][player.x].type = player.facing
  })
  return (
    '\n\n' +
    gridCopy
      .map(column => column.map(cell => cell.type).join(''))
      .slice()
      .reverse()
      .join('\n')
  )
}

export function stringifyInstructions(
  moveInstruction: MoveInstruction,
  rotateInstruction: RotateInstruction | undefined = undefined
): string {
  let str = `Move ${moveInstruction}`
  if (rotateInstruction) {
    str += `, rotate to the ${rotateInstruction === 'R' ? 'right' : 'left'}`
  }
  return `\n\n===== ${str} =====`
}

export function parseInput(input: string): {
  grid: Grid
  instructions: Instruction[]
} {
  const [mapString, instructionString] = input.split('\n\n')
  const grid: Grid = mapString
    .split('\n')
    .map(line => line.split('').map(sign => ({ type: sign })) as Cell[])
    .reverse()
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
