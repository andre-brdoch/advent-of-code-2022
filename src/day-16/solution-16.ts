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
  open?: boolean
}
interface ValveAnalyzed extends Valve {
  distances: DistanceMap
  potentialByRound: PotentialMap
}
interface Action {
  type: 'move' | 'open'
  target: ValveAnalyzed
}
type Sequence = Array<Action>
interface Evaluation {
  sequence: Sequence
  potential: number
  turns: number
}

const MAX_TURNS = 30
const START_NAME = 'AA'

export default async function solution(input: string): Promise<Solution16> {
  console.log(input)
  console.log('----')

  const valves = parseValves(input)

  const analyzedValves = analyzeValves(valves)
  const startingValve = getByName(START_NAME, analyzedValves)
  const remaining = getRemaining(analyzedValves)
  const valveCombinations = getAllCombinations(remaining)
  const sequences = valveCombinations.map(targetsToActions)
  const evaluated = sequences.map(sequence =>
    evaluateSequence(startingValve, sequence)
  )
  const bestSequence = evaluated.sort((a, b) => b.potential - a.potential)[0]
  const answer1 = bestSequence.potential
  console.log(bestSequence)

  return { answer1 }
}

function getDistances(startingValve: Valve): DistanceMap {
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

  console.log(distances)
  return distances
}

function evaluateSequence(
  startingValve: ValveAnalyzed,
  sequence: Sequence
): Evaluation {
  let current = startingValve
  let turn = 0
  let potential = 0

  for (let i = 0; i < sequence.length; i++) {
    const action = sequence[i]
    const { type, target } = action

    if (type === 'move' && target !== current) {
      const distance = getShortestDistance(current, target)
      const newTurn = turn + distance
      if (newTurn > MAX_TURNS) break
      turn = newTurn
      // move to target
      current = target
    }
    else if (type === 'open' && target === current) {
      const newTurn = turn + 1
      if (newTurn > MAX_TURNS) break
      turn = newTurn
      const targetPotential = target.potentialByRound[turn]
      potential += targetPotential
    }
    else throw new Error(`Invalid action: '${JSON.stringify(action)}'`)
  }

  return {
    sequence,
    potential,
    turns: turn,
  }
}

function getAllCombinations<V>(list: Array<V>): Array<Array<V>> {
  if (list.length === 1) return [list]
  else if (list.length === 2) return [list, [list[1], list[0]]]
  else {
    return list.flatMap(item => {
      // keep item constant in first position, and repeat on remaining elements
      return getAllCombinations(list.filter(el => el !== item)).map(y => [
        item,
        ...y,
      ])
    })
  }
}

function targetsToActions(targetValves: ValveAnalyzed[]): Sequence {
  return targetValves.reduce(
    (result, target) => [
      ...result,
      { type: 'move', target },
      { type: 'open', target },
    ],
    [] as Sequence
  )
}

function getByName<V extends { name: string }>(name: string, items: V[]): V {
  const result = items.find(item => item.name === name)
  if (!result) throw new Error(`Valve with name "${name}" does not exist.`)
  return result
}

function getRemaining<V>(valves: Array<V>): Array<V> {
  // @ts-ignore
  return valves.filter(valve => !valve.open && valve.flowRate > 0)
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
