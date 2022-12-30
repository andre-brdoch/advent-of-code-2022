interface Solution16 {
  answer1: number
}
interface DistanceMap {
  [key: string]: number
}
interface PotentialMap {
  [key: string]: number
}
interface ValveParsed {
  name: string
  flowRate: number
  neighborNames?: string[]
  neighbors?: (ValveParsed | Valve)[]
}
interface Valve extends Omit<ValveParsed, 'neighborNames'> {
  neighbors: Valve[]
}
interface ValveAnalyzed extends Valve {
  distances: DistanceMap
  potentialByRound: PotentialMap
}
interface Turn {
  valve: ValveAnalyzed
  turnOpened: number
  flowRateTotal: number
}
type Sequence = Array<Turn>
interface CameFromMap {
  [key: string]: ValveAnalyzed | null
}
interface CostMap {
  [key: string]: number
}

const MAX_TURNS = 30
const START_NAME = 'AA'

export default async function solution(input: string): Promise<Solution16> {
  const valves = parseValves(input)
  const analyzedValves = analyzeValves(valves)

  const startingValve = getByName(START_NAME, analyzedValves)
  find(analyzedValves, startingValve)
  // const remaining = getRemaining(analyzedValves)
  // const sequence = buildSequence(startingValve, remaining, 0)
  // console.log(stringifySequence(sequence))
  // const answer1 = sequence.reduce(
  //   (result, turn) => result + turn.flowRateTotal,
  //   0
  // )

  return { answer1: 0 }
}

function find(valves: ValveAnalyzed[], startingValve: ValveAnalyzed): any {
  const frontier = new PriorityQueue<ValveAnalyzed>()
  frontier.add(startingValve, 0)
  const potentialSoFar: Record<string, number> = { [startingValve.name]: 0 }
  const cameFrom: Record<number, Record<string, ValveAnalyzed | null>> = {
    [startingValve.name]: null,
  }
  const relevantValves = getRemaining(valves)

  while (!frontier.empty()) {
    const current = frontier.get() as ValveAnalyzed
    const neighbors = relevantValves.filter(valve => valve !== current)

    // todo: implement ending codition
    // todo: possibly lacking starting valve
    if (getPath(cameFrom, current).length > 6) {
      console.log('broke things')
      console.log(getPath(cameFrom, current))
      break
    }

    neighbors.forEach(next => {
      const distance = getShortestDistance(current, next)
      const nextPotential = next.potentialByRound[distance]
      const totalPotential = potentialSoFar[current.name] + nextPotential
      console.log(`distance: ${distance}, potential: ${totalPotential}`)

      if (
        !(next.name in potentialSoFar) ||
        totalPotential > potentialSoFar[next.name]
      ) {
        console.log('add to queue')

        potentialSoFar[next.name] = totalPotential
        frontier.add(next, totalPotential)
        cameFrom[next.name] = current
      }
    })
  }

  console.log(cameFrom)
}

function getPath(
  cameFrom: CameFromMap,
  endingValve: ValveAnalyzed
): ValveAnalyzed[] {
  // find shortest path from end till start
  const path: ValveAnalyzed[] = [endingValve]
  let current: ValveAnalyzed | null = endingValve
  while (current !== null) {
    const prev: ValveAnalyzed | null = cameFrom[current.name]
    current = prev
    if (prev === null) break
    path.push(prev)
  }

  return path
}

function getDistances(startingValve: Valve): DistanceMap {
  // breath first search
  const frontier = [startingValve]
  const distances = { [startingValve.name]: 0 }
  // @ts-ignore
  let current

  while (frontier.length) {
    current = frontier.shift()
    // @ts-ignore
    current.neighbors.forEach(next => {
      if (!(next.name in distances)) {
        frontier.push(next)
        // @ts-ignore
        distances[next.name] = distances[current.name] + 1
      }
    })
  }

  return distances
}

function getByName<V extends { name: string }>(name: string, items: V[]): V {
  const result = items.find(item => item.name === name)
  if (!result) throw new Error(`Valve with name "${name}" does not exist.`)
  return result
}

function getRemaining<V>(valves: Array<V>): Array<V> {
  // @ts-ignore
  return valves.filter(valve => valve.flowRate > 0)
}

function stringifySequence(sequence: Sequence): string {
  return sequence
    .map(
      turn =>
        `${turn.valve.name}: ${String(turn.turnOpened).padStart(
          2,
          '0'
        )}, releasing gas totalling ${turn.flowRateTotal}`
    )
    .join('\n')
}

function parseValves(input: string): Valve[] {
  const valvesParsed: ValveParsed[] = input.split('\n').map(line => {
    const match = line.match(
      /^Valve (\w+) has flow rate=(\d+); tunnel(?:s)? lead(?:s)? to valve(?:s)? (.*)$/
    )
    if (match === null) throw new Error('Invalid input')
    return {
      name: match[1],
      flowRate: Number(match[2]),
      neighborNames: match[3].split(', '),
    }
  })
  valvesParsed.forEach(valve => {
    const withNeighbors = (valve.neighborNames ?? []).map(name =>
      getByName(name, valvesParsed)
    )
    valve.neighbors = withNeighbors
    delete valve.neighborNames
  })
  return valvesParsed as Valve[]
}

function getShortestDistance(a: ValveAnalyzed, b: ValveAnalyzed): number {
  return a.distances[b.name]
}

function analyzeValves(valves: Valve[]): ValveAnalyzed[] {
  return valves.map(valve => {
    const distances: DistanceMap = getDistances(valve)
    const potentialByRound = Array.from(Array(MAX_TURNS))
      .map((_, i) => i)
      .reduce(
        (result, number) => ({
          ...result,
          [number]: valve.flowRate * (MAX_TURNS - number),
        }),
        {} as PotentialMap
      )
    return {
      ...valve,
      distances,
      potentialByRound,
    }
  })
}

class PriorityQueue<T> {
  private items: {
    item: T
    priority: number
  }[]

  constructor() {
    this.items = []
  }

  public add(item: T, priority: number) {
    this.items.push({ item, priority })
  }

  public get() {
    if (this.empty()) return null
    const highestPrio = this.items.sort((a, b) => b.priority - a.priority)[0]
    const i = this.items.indexOf(highestPrio)
    this.items.splice(i, 1)
    return highestPrio.item
  }

  public empty() {
    return this.items.length === 0
  }
}
