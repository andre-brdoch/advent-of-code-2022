interface Solution5 {
  answer1: string
}
type Stack = string[]
interface Instruction {
  from: number
  to: number
  amount: number
}

export default async function solution(input: string): Promise<Solution5> {
  console.log(input)
  console.log('---')
  const {stacks, instructions} = parseFile(input)
  console.log(stacks);
  console.log(instructions);
  

  return { answer1: 'hello world' }
}

function parseFile(file: string): {
  stacks: Stack[]
  instructions: Instruction[]
} {
  const [stackString, instructionString] = file.split('\n\n')
  const stacks = parseStacks(stackString)
  const instructions = parseInstructions(instructionString)
  return { stacks, instructions }
}

function parseStacks(stackString: string): Stack[] {
  const lines = stackString.split('\n')
  const stackCount = getStackCountFromLines(lines)
  return Array.from(Array(stackCount)).map((n, i) => parseStack(lines, i))
}

function parseInstructions(instructionString: string): Instruction[] {
  return instructionString.split('\n').map(line => {
    const match = line.match(/move (\d+) from (\d+) to (\d+)/)
    if (!match || match.length < 4) {
      throw new Error(`"${line}" is not a valid instruction`)
    }
    const [, amount, from, to] = match
    return { from: Number(from), to: Number(to), amount: Number(amount) }
  })
}

function parseStack(lines: string[], i: number): Stack {
  return (
    lines
      // remove line number
      .slice(0, lines.length - 1)
      // flip for easier array handling
      .reverse()
      // find char by offsetting depending on i
      .map(line => line.charAt(i * 4 + 1))
      .filter(char => char !== ' ')
  )
}

function getStackCountFromLines(lines: string[]): number {
  // read stack amount from last number in last line
  const numbersLine = lines[lines.length - 1]
  const match = numbersLine.match(/(\d+)\s*$/)
  if (match === null) throw new Error('Could not get stack count')
  const [, count] = match
  return Number(count)
}
