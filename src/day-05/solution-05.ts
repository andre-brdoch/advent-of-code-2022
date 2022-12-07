interface Solution5 {
  answer1: string
}
type Stacks = string[][]
interface Instruction {
  from: number
  to: number
  amount: number
}

export default async function solution(input: string): Promise<Solution5> {
  console.log(input)
  console.log('---')
  const { instructions } = parseFile(input)
  console.log(instructions)

  return { answer1: 'hello world' }
}

function parseFile(file: string): { instructions: Instruction[] } {
  const [, instructionString] = file.split('\n\n')
  const instructions = parseInstructions(instructionString)
  return { instructions }
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
