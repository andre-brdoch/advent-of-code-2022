interface Solution22 {
  answer1: number
}
interface Coordinate {
  x: number
  y: number
}
type Facing = '^' | '>' | 'v' | '<'
interface Player extends Coordinate {
  facing: Facing
}
type Path = Player[]
type Cell = '.' | '#' | ' ' | Facing
type Grid = Cell[][]
type RotateInstruction = 'L' | 'R'
type Instruction = number | RotateInstruction

const INITIAL_FACING = '>'

export default async function solution(input: string): Promise<Solution22> {
  const { grid, instructions } = parseInput(input)
  const player = createPlayer(grid)
  console.log(stringifyGrid(grid, [player, { ...player, x: player.x + 1 }]))
  console.log(player)

  return { answer1: 0 }
}

function createPlayer(grid: Grid): Player {
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
