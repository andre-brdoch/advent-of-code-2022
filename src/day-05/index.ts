import { SolutionFn } from '../types.js'
import { Stack, Instruction } from './types'

export default (async function solution(input) {
  const { stacks, instructions } = parseFile(input)
  const newStacks9000 = moveStacks(stacks, instructions)
  const newStacks9001 = moveStacks(stacks, instructions, true)
  const answer1 = getTopCrates(newStacks9000).join('')
  const answer2 = getTopCrates(newStacks9001).join('')

  return { answer1, answer2 }
} satisfies SolutionFn)

function moveStacks(
  stacks: Stack[],
  instructions: Instruction[],
  preserveOrder = false
): Stack[] {
  // copy
  const newStacks = stacks.map(stack => [...stack])
  instructions.forEach(({ from, to, amount }) => {
    const fromStack = newStacks[from - 1]
    const cratesToMove = fromStack.splice(fromStack.length - amount, amount)
    if (!preserveOrder) cratesToMove.reverse()
    newStacks[to - 1] = [...newStacks[to - 1], ...cratesToMove]
  })
  return newStacks
}

function getTopCrates(stacks: Stack[]): string[] {
  return stacks.map(stack => stack[stack.length - 1])
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
