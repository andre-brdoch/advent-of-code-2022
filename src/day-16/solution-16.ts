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

const MAX_TURNS = 30
const START_NAME = 'AA'

export default async function solution(input: string): Promise<Solution16> {
  console.log(input)
  console.log('----')

  const valves = parseValves(input)
  const analyzedValves = analyzeValves(valves)
  const startingValve = getByName(START_NAME, analyzedValves)
  const remaining = getRemaining(analyzedValves)
  const sequence = buildSequence(startingValve, remaining, 0)
  console.log(stringifySequence(sequence))
  const answer1 = sequence.reduce(
    (result, turn) => result + turn.flowRateTotal,
    0
  )

  return { answer1 }
}

function buildSequence(
  currentValve: ValveAnalyzed,
  remainingValves: ValveAnalyzed[],
  currentTurn: number
): Sequence {
  if (remainingValves.length === 0) return []

  if (currentTurn === 2) {
    console.log('CURRENT:')
    console.log(currentValve.name)
    console.log('---')
  }

  // find best next valve
  const prioritized = remainingValves
    .map(valve => {
      const distance = getShortestDistance(currentValve, valve)
      const turnOpened = distance + currentTurn + 1
      const flowRateTotal = valve.potentialByRound[turnOpened]
      const priority = flowRateTotal / turnOpened
      return {
        turnOpened,
        flowRateTotal,
        priority,
        valve,
      }
    })
    .sort((a, b) => b.priority - a.priority)

  if (currentTurn === 2) {
    prioritized.slice(0, 3).forEach(({ valve, flowRateTotal, priority }) => {
      console.log(valve.name)
      console.log('flowRateTotal:', flowRateTotal)
      console.log('priority:', priority)
      console.log('---')
    })
  }

  const [selectedTurn, ...discardedTurns] = prioritized
  const otherValves = discardedTurns.map(turn => turn.valve)
  const nextTurns = buildSequence(
    selectedTurn.valve,
    otherValves,
    selectedTurn.turnOpened
  )
  return [
    selectedTurn,
    ...buildSequence(
      selectedTurn.valve,
      nextTurns.map(turn => turn.valve),
      selectedTurn.turnOpened
    ),
  ]
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
