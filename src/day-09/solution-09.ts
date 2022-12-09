interface Solution9 {
  answer1: number
}
type Direction = 'U' | 'R' | 'D' | 'L'
interface Motion {
  direction: Direction
  amount: number
}
interface Position {
  x: number
  y: number
}

export default async function solution(input: string): Promise<Solution9> {
  console.log(input)
  console.log('----')

  const motions = parseHeadMotions(input)
  console.log(motions)
  const positions = moveHead(motions)
  console.log(positions)

  //   const p1 = { x: 0, y: 0 }
  //   const ps = movePosition(p1, motions[0])
  //   console.log(ps)
  //   const ps2 = movePosition(ps[ps.length - 1], motions[1])
  //   console.log(ps2)

  return { answer1: 0 }
}

function moveHead(motions: Motion[]): Position[] {
  const positions: Position[] = [{ x: 0, y: 0 }]
  motions.forEach(motion => {
    const lastPosition = positions[positions.length - 1]
    const newPositions = movePosition(lastPosition, motion)
    positions.push(...newPositions)
  })
  return positions
}

function movePosition(position: Position, motion: Motion): Position[] {
  const { direction, amount } = motion
  const coordinate = direction === 'R' || direction === 'L' ? 'x' : 'y'
  const flipper = direction === 'R' || direction === 'U' ? 1 : -1
  return Array.from(Array(amount)).map((n, i) => ({
    ...position,
    [coordinate]: position[coordinate] + (i + 1) * flipper,
  }))
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
