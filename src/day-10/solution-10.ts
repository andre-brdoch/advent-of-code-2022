interface Solution10 {
  answer1: number
}
type Command = 'addx' | 'noop'
interface Line {
  command: Command
}
interface LineAdd extends Line {
  value: number
}
interface Cycle {
  number: number
  x: number
  signalStrength: number
  line: Line
}
type Pixel = '#' | '.'
type Screen = Pixel[][]

const GROUP_SIZE = 40

export default async function solution(input: string): Promise<Solution10> {
  console.log(input)
  console.log('----')

  const parsed = parseLines(input)
  const cycles = getCycles(parsed)
  const interestingCycles = getInterestingCycles(cycles)
  console.log(parsed)
  console.log(cycles)
  console.log('getInterestingCycles')
  console.log(interestingCycles)
  const answer1 = getSum(interestingCycles.map(cycle => cycle.signalStrength))
  const screen = getScreen(cycles)
  console.log(screen)
  console.log(stringifyScreen(screen))

  return { answer1 }
}

function getScreen(cycles: Cycle[]): Screen {
  const rows: Screen = []
  // copy
  const remainingCycles = cycles.slice()
  while (remainingCycles.length) {
    const row: Pixel[] = remainingCycles
      .splice(0, GROUP_SIZE)
      .map(({ number, x }) => {
        const xPx = number % GROUP_SIZE
        const overlaps = x - 1 <= xPx && xPx <= x + 1
        const px = overlaps ? '#' : '.'
        return px
      })
    rows.push(row)
  }
  return rows
}

function stringifyScreen(screen: Screen): string {
  return screen.map(row => row.join('')).join('\n')
}

function getInterestingCycles(cycles: Cycle[]): Cycle[] {
  return cycles.reduce((result, cycle) => {
    if (cycle.number === 20 || (cycle.number - 20) % GROUP_SIZE === 0) {
      return [...result, cycle]
    }
    return result
  }, [] as Cycle[])
}

function getCycles(lines: Line[]): Cycle[] {
  return lines.reduce((result, line) => {
    const lastCycle = result[result.length - 1]
    const newX = lastCycle
      ? isLineAdd(lastCycle.line)
        ? lastCycle.x + lastCycle.line.value
        : lastCycle.x
      : 1
    const number = result.length + 1
    const signalStrength = getSignalStrength(newX, number)
    const newCycle: Cycle = {
      number,
      x: newX,
      signalStrength,
      line,
    }
    if (isLineAdd(line)) {
      const newNumber = result.length + 2
      const newSignalStrength = getSignalStrength(newX, newNumber)
      return [
        ...result,
        newCycle,
        {
          ...newCycle,
          number: result.length + 2,
          signalStrength: newSignalStrength,
        },
      ]
    }
    return [...result, newCycle]
  }, [] as Cycle[])
}

function getSignalStrength(x: number, number: number): number {
  return x * number
}

function parseLines(input: string): Line[] {
  return input.split('\n').map(line => {
    if (line === 'noop') {
      return { command: 'noop' }
    }
    const [command, value] = line.split(' ')
    if (command !== 'addx') throw new Error(`Invalid command "${command}"`)
    if (value === undefined) throw new Error('Missing value')
    return { command: 'addx', value: Number(value) }
  })
}

function isLineAdd(line: Line | LineAdd): line is LineAdd {
  return line.command === 'addx' && (line as LineAdd).value !== undefined
}

function getSum(numbers: number[]): number {
  return numbers.reduce((result, number) => result + number, 0)
}
