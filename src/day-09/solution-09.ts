interface Solution9 {
  answer1: number
  answer2: number
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
  const answer1 = getAnswer1(motions)
  const answer2 = getAnswer2(motions)

  return { answer1, answer2 }
}

function getAnswer1(headMotions: Motion[]): number {
  const headPositions = moveHead(headMotions)
  const tailPositions = followKnot(headPositions)
  return countUniquePositions(tailPositions)
}

function getAnswer2(headMotions: Motion[]): number {
  const headPositions = moveHead(headMotions)
  const tailPositions = followKnot(headPositions)
  return countUniquePositions(tailPositions)
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

function followKnot(prevKnotPositions: Position[]): Position[] {
  // starts on the same field as previous knot
  const currentPositions: Position[] = prevKnotPositions.slice(0, 1)

  prevKnotPositions.forEach((prevKnot, i) => {
    const current = currentPositions[currentPositions.length - 1]
    if (areAdjacent(prevKnot, current)) {
      console.log(
        `${stringifyPosition(current)} - ${stringifyPosition(prevKnot)} - STAY`
      )
    }
    else {
      const recentPrevKnotPositions = prevKnotPositions.slice(0, i + 1)
      const prevKnot =
        recentPrevKnotPositions[recentPrevKnotPositions.length - 2]
      const newCurrent = { ...prevKnot }
      console.log(
        `${stringifyPosition(newCurrent)} - ${stringifyPosition(
          recentPrevKnotPositions[recentPrevKnotPositions.length - 1]
        )} - MOVE`
      )
      currentPositions.push(newCurrent)
    }
  })

  return currentPositions
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

function countUniquePositions(positions: Position[]): number {
  const set = new Set(positions.map(stringifyPosition))
  return set.size
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

function areAdjacent(a: Position, b: Position): boolean {
  const xDistance = a.x - b.x
  const yDistance = a.y - b.y
  const xAdjacent = -1 <= xDistance && xDistance <= 1
  const yAdjacent = -1 <= yDistance && yDistance <= 1
  return xAdjacent && yAdjacent
}

function stringifyPosition(position: Position): string {
  return `${position.x}/${position.y}`
}

// === Typescript helpers ===

function isDirection(char: unknown): char is Direction {
  return ['U', 'R', 'D', 'L'].some(direction => direction === char)
}
