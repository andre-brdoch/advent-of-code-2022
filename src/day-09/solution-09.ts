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
  const answer1 = getAnswer1(motions)
  const answer2 = getAnswer2(motions)

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

function followKnot(headPositions: Position[]): Position[] {
  // starts on the same field as previous knot
  const tailPositions: Position[] = headPositions.slice(0, 1)

  headPositions.forEach((headPosition, i) => {
    if (i === 0) return
    const prevTailPosition = tailPositions[i - 1]
    const vector: Position = clampVector(
      {
        x: headPosition.x - prevTailPosition.x,
        y: headPosition.y - prevTailPosition.y,
      },
      -1,
      1
    )

    if (areAdjacent(headPosition, prevTailPosition)) {
      tailPositions.push(prevTailPosition)
    }
    else {
      const currentTailPosition = addPositions(prevTailPosition, vector)
      tailPositions.push(currentTailPosition)
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

function clamp(number: number, min: number, max: number): number {
  return Math.min(Math.max(number, min), max)
}

function clampVector(vector: Position, min: number, max: number): Position {
  const { x, y } = vector
  return {
    x: clamp(x, min, max),
    y: clamp(y, min, max),
  }
}

function addPositions(a: Position, b: Position): Position {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  }
}

// === Visualize ===

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function animateRope(
  ropeMovement: RopeMovement,
  delay: number
): Promise<void> {
  const outputs = stringifyAllRopeTurns(ropeMovement).split('\n\n')
  for (const output of outputs) {
    await wait(delay)
    console.log(output)
  }
}

function stringifyAllRopeTurns(
  ropeMovement: RopeMovement,
  untilTurn: number | undefined = undefined
): string {
  return ropeMovement[0]
    .slice(0, untilTurn)
    .map((_, i) => `TURN ${i}:${stringifyRopeAtTurn(ropeMovement, i)}`)
    .join('\n\n\n')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function strinfigyRopePerMotion(
  ropeMovement: RopeMovement,
  motions: Motion[]
): string {
  let turn = 0
  let string = ''
  motions.forEach(motion => {
    turn += motion.amount
    string += `\n\n\n${motion.direction}${motion.amount}:\n`
    string += stringifyRopeAtTurn(ropeMovement, turn)
    string += '\n'
  })
  return string
}

function stringifyRopeAtTurn(ropeMovement: RopeMovement, turn: number): string {
  const { normalizedRopeMovement } = normalizeRopeMovement(ropeMovement)
  const grid = getGrid(normalizedRopeMovement)
  const currentKnotPositions = normalizedRopeMovement.map(
    knotPositions => knotPositions[turn]
  )

  currentKnotPositions.forEach((position, i) => {
    const { x, y } = position
    const marker =
      i === 0 ? 'H' : i === currentKnotPositions.length - 1 ? 'T' : String(i)
    if (grid[x][y] === '.') {
      grid[x][y] = marker
    }
  })

  return stringifyGrid(grid)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function stringifyKnotMovement(ropeMovement: RopeMovement, i: number): string {
  const { normalizedRopeMovement } = normalizeRopeMovement(ropeMovement)
  const positions = normalizedRopeMovement[i]
  const grid = getGrid(normalizedRopeMovement)

  positions.forEach(position => {
    const { x, y } = position
    if (grid[x][y] === '.') grid[x][y] = '#'
  })

  return stringifyGrid(grid)
}

function stringifyGrid(grid: string[][]): string {
  let string = ''
  const gridRotated = grid.map(row => row.slice().reverse())
  for (let i = 0; i < grid[0].length; i++) {
    string += '\n'
    for (let j = 0; j < grid.length; j++) {
      string += gridRotated[j][i] + ' '
    }
  }
  return string
}

function stringifyPosition(position: Position): string {
  return `${position.x}/${position.y}`
}

function getGrid(normalizedRopeMovement: RopeMovement): string[][] {
  const flat = normalizedRopeMovement.flat()
  const width = getExtremeCoordinate(flat, 'x', 'max') + 1
  const height = getExtremeCoordinate(flat, 'y', 'max') + 1

  return Array.from(Array(width)).map(() =>
    Array.from(Array(height)).map(() => '.')
  )
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

function wait(time: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

// === Typescript helpers ===

function isDirection(char: unknown): char is Direction {
  return ['U', 'R', 'D', 'L'].some(direction => direction === char)
}
