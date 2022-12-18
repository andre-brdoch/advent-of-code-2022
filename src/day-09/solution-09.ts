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
type RopeMovement = Position[][]

export default async function solution(input: string): Promise<Solution9> {
  console.log(input)
  console.log('----')

  const motions = parseHeadMotions(input)

  // const answer1 = 1
  const answer1 = getAnswer1(motions)
  const answer2 = getAnswer2(motions)
  // const answer2 = 0

  return { answer1, answer2 }
}

function getAnswer1(headMotions: Motion[]): number {
  const ropeMovement = moveRope(headMotions, 2)
  const tailPositions = ropeMovement[ropeMovement.length - 1]
  return countUniquePositions(tailPositions)
}

function getAnswer2(headMotions: Motion[]): number {
  const ropeMovement = moveRope(headMotions, 10)
  const tailPositions = ropeMovement[ropeMovement.length - 1]
  return countUniquePositions(tailPositions)
}

function moveRope(headMotions: Motion[], ropeLength: number): RopeMovement {
  if (ropeLength < 2) throw new Error('Rope is too short!')
  const headPositions = moveHead(headMotions)
  const ropeMovement: RopeMovement = [headPositions]

  Array.from(Array(ropeLength - 1)).forEach(() => {
    const prevKnotPositions: Position[] = ropeMovement[ropeMovement.length - 1]

    ropeMovement.push(followKnot(prevKnotPositions))
  })
  return ropeMovement
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

function followKnot(knotPositions: Position[]): Position[] {
  // starts on the same field as previous knot
  const newKnotPositions: Position[] = knotPositions.slice(0, 1)

  knotPositions.forEach((knotPosition, i) => {
    const prevNewKnotPosition = newKnotPositions[newKnotPositions.length - 1]
    const prevKnotPosition = knotPositions[i - 1]
    if (areAdjacent(knotPosition, prevNewKnotPosition)) {
      newKnotPositions.push(prevNewKnotPosition)
    }
    // if diagonal movement needed:
    else if (
      prevNewKnotPosition.x !== knotPosition.x &&
      prevNewKnotPosition.y !== knotPosition.y
    ) {
      const vector: Position = {
        x: clamp(knotPosition.x - prevNewKnotPosition.x, -1, 1),
        y: clamp(knotPosition.y - prevNewKnotPosition.y, -1, 1),
      }
      const newCurrent = addPositions(prevNewKnotPosition, vector)
      newKnotPositions.push(newCurrent)
    }
    // if horizontal/vertical movement needed:
    else {
      // move to previous' knots position:
      const newCurrent = { ...prevKnotPosition }
      newKnotPositions.push(newCurrent)
    }
  })

  return newKnotPositions
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

function clamp(number: number, min: number, max: number): number {
  return Math.min(Math.max(number, min), max)
}

function addPositions(a: Position, b: Position): Position {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  }
}

function printRope(knots: Position[]): void {
  knots.forEach((knot, i) => {
    const name = i === 0 ? 'H' : i === knots.length - 1 ? 'T' : i + 2
    const msg = `${name}: stringifyPosition(knot)`
    console.log(msg)
  })
}

// === Typescript helpers ===

function isDirection(char: unknown): char is Direction {
  return ['U', 'R', 'D', 'L'].some(direction => direction === char)
}
