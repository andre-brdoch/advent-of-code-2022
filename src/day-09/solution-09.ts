interface Solution9 {
  answer1: number
}
type Direction = 'U' | 'R' | 'D' | 'L'
interface Motion {
  direction: Direction
  amount: number
}

export default async function solution(input: string): Promise<Solution9> {
  console.log(input)
  console.log('----')

  const motions = parseHeadMotions(input)
  console.log(motions)

  return { answer1: 0 }
}

function parseHeadMotions(input: string): Motion[] {
  return input.split('\n').map(line => {
    const [direction, amount] = line.split(' ')
    if (!isDirection(direction)) {
      throw new Error(
        `Failed to parse input - "${direction}" is not a valid direction.`
      )
    }
    return {
      direction,
      amount: Number(amount),
    }
  })
}

// === Typescript helpers ===

function isDirection(char: unknown): char is Direction {
  return ['U', 'R', 'D', 'L'].some(direction => direction === char)
}
