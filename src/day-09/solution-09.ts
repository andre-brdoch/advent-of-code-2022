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
  const headPositions = moveHead(motions)
  console.log(headPositions)
  const tailPositions = moveTail(headPositions)
  console.log(tailPositions)
  const x = tailPositions.map(position => `${position.x}/${position.y}`)
  console.log(x)

  //   console.log(areAdjacent({ x: 0, y: 1 }, { x: 0, y: 1 }))
  //   console.log(areAdjacent({ x: 1, y: 0 }, { x: 0, y: 1 }))
  //   console.log(areAdjacent({ x: 5, y: 3 }, { x: 4, y: 4 }))
  //   console.log(areAdjacent({ x: 0, y: -1 }, { x: 0, y: 1 }))

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

function moveTail(headPositions: Position[]): Position[] {
  // starts on the same field as head
  const tailPositions: Position[] = headPositions.slice(0, 1)
  headPositions.forEach((head, i) => {
    const tail = tailPositions[tailPositions.length - 1]
    if (areAdjacent(head, tail)) {
      console.log(
        `${stringifyPosition(tail)} - ${stringifyPosition(head)} - STAY`
      )
    }
    else {
      const newTail = tailFollowHead(tail, headPositions.slice(0, i + 1))
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

function tailFollowHead(tail: Position, headPositions: Position[]): Position {
  const head = headPositions[headPositions.length - 1]
  const newTail = { ...tail }
  const xDistance = head.x - tail.x
  const yDistance = head.y - tail.y
  const isDiagonal = xDistance && yDistance

  if (isDiagonal) {
    console.log('DIAGONAL')

    // if diagonal, move to the heads PREVIOUS position
    const { x, y } = headPositions[headPositions.length - 2]
    newTail.x = x
    newTail.y = y
  }
  else {
    if (xDistance) {
      newTail.x = newTail.x + xDistance - 1
    }
    if (yDistance) {
      newTail.y = newTail.y + yDistance - 1
    }
  }
  console.log(
    `${stringifyPosition(newTail)} - ${stringifyPosition(head)} - MOVE`
  )
  return newTail
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
