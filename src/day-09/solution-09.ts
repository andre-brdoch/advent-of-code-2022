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
type Axis = keyof Position
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
  console.log(stringifyAllRopeTurns(ropeMovement))

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

function followKnot(headPositions: Position[]): Position[] {
  // starts on the same field as head
  const tailPositions: Position[] = headPositions.slice(0, 1)
  headPositions.forEach((head, i) => {
    if (i === 0) return
    const prevTail = tailPositions[tailPositions.length - 1]
    if (areAdjacent(head, prevTail)) {
      // repeat last position
      tailPositions.push(prevTail)
    }
    else {
      const prevHead = headPositions[i - 1]
      // move to previous turns head position
      const newTail = { ...prevHead }
      tailPositions.push(newTail)
    }
  })
  return tailPositions
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

// === Visualize ===

function stringifyAllRopeTurns(ropeMovement: RopeMovement): string {
  return ropeMovement[0]
    .map((_, i) => `TURN ${i}:${stringifyRopeAtTurn(ropeMovement, i)}`)
    .join('\n\n\n')
}

function stringifyRopeAtTurn(ropeMovement: RopeMovement, turn: number): string {
  const { normalizedRopeMovement } = normalizeRopeMovement(ropeMovement)
  const flat = normalizedRopeMovement.flat()
  const width = getExtremeCoordinate(flat, 'x', 'max') + 1
  const height = getExtremeCoordinate(flat, 'y', 'max') + 1
  const currentKnotPositions = normalizedRopeMovement.map(
    knotPositions => knotPositions[turn]
  )

  const grid = Array.from(Array(width)).map(() =>
    Array.from(Array(height)).map(() => '.')
  )

  currentKnotPositions.forEach((position, i) => {
    const { x, y } = position
    const marker =
      i === 0 ? 'H' : i === currentKnotPositions.length - 1 ? 'T' : String(i)
    if (grid[x][y] === '.') {
      grid[x][y] = marker
    }
  })

  let string = ''
  const gridRotated = grid.map(row => row.slice().reverse())
  for (let i = 0; i < height; i++) {
    string += '\n'
    for (let j = 0; j < width; j++) {
      string += gridRotated[j][i] + ' '
    }
  }
  return string
}

/** Adjust coordinate range to start from 0/0 */
function normalizeRopeMovement(ropeMovement: RopeMovement): {
  normalizedRopeMovement: RopeMovement
  offsetX: number
  offsetY: number
} {
  // include sand start coordinates:
  const flatCoordinates = ropeMovement.flat()
  const xMin = getExtremeCoordinate(flatCoordinates, 'x', 'min')
  const yMin = getExtremeCoordinate(flatCoordinates, 'y', 'min')
  const normalized = ropeMovement.map(path =>
    path.map(({ x, y }) => ({ x: x - xMin, y: y - yMin }))
  )
  return {
    normalizedRopeMovement: normalized,
    offsetX: -xMin,
    offsetY: -yMin,
  }
}

function getExtremeCoordinate(
  positions: Position[],
  axis: Axis,
  type: 'min' | 'max'
): number {
  return positions
    .map(position => position[axis])
    .sort((a, b) => (type === 'min' ? a - b : b - a))[0]
}

// === Typescript helpers ===

function isDirection(char: unknown): char is Direction {
  return ['U', 'R', 'D', 'L'].some(direction => direction === char)
}
