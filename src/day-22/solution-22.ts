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
type Cell = '.' | '#' | ' ' | Facing
type Grid = Cell[][]
type RotateInstruction = 'L' | 'R'
type Instruction = number | RotateInstruction

export default async function solution(input: string): Promise<Solution22> {
  const { grid, instructions } = parseInput(input)
  console.log(instructions)

  return { answer1: 0 }
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
