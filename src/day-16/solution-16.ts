import { Logger } from '../utils/Logger.js'

interface Solution16 {
  answer1: number
  answer2: number
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
type CameFromMap = Record<string, QueueState | null>
interface QueueState {
  valveName: string
  currentTotalFlow: number
  timeLeft: number
}
interface SimpleActionPath {
  valveNames: string[]
  totalFlow: number
}
interface Pairing {
  actions: [SimpleActionPath, SimpleActionPath]
  totalFlow: number
}

const START_NAME = 'AA'

const logger = new Logger()

export default async function solution(input: string): Promise<Solution16> {
  const valves = parseValves(input)
  const answer1 = getAnswer1(valves)
  const answer2 = getAnswer2(valves)
  return { answer1, answer2 }
}

function getAnswer2(valves: Valve[]): number {
  const maxTurns = 26
  const analyzedValves = analyzeValves(valves, maxTurns)
  const startingValve = getByName(START_NAME, analyzedValves)
  return getHighestFlowRate(analyzedValves, startingValve, maxTurns, true)
}

function getAnswer1(valves: Valve[]): number {
  const maxTurns = 30
  const analyzedValves = analyzeValves(valves, maxTurns)
  const startingValve = getByName(START_NAME, analyzedValves)
  return getHighestFlowRate(analyzedValves, startingValve, maxTurns)
}

function getHighestFlowRate(
  valves: ValveAnalyzed[],
  startingValve: ValveAnalyzed,
  maxTurns: number,
  withElephant = false
): number {
  let totalFlow
  let msg
  if (!withElephant) {
    const { bestPath } = analyzePaths(valves, startingValve, maxTurns)
    totalFlow = bestPath[bestPath.length - 1].currentTotalFlow
    msg = `Best path is ${bestPath
      .map(v => v.valveName)
      .join(' -> ')}, resulting in a total flow of ${totalFlow}.\n`
  }
  else {
    const bestPairing = findBestPairing(valves, startingValve, maxTurns)
    const [player, elephant] = bestPairing.actions
    totalFlow = bestPairing.totalFlow
    msg = `Player visits ${player.valveNames.join(' -> ')} (${
      player.totalFlow
    }),\nElephant visits  ${elephant.valveNames.join(' -> ')},\nTotal flow: ${
      elephant.totalFlow
    }\n`
  }

  logger.log(msg)
  return totalFlow
}

function findBestPairing(
  valves: ValveAnalyzed[],
  startingValve: ValveAnalyzed,
  maxTurns: number
): Pairing {
  const { allPaths, bestPath } = analyzePaths(valves, startingValve, maxTurns)
  const bestFlowSinglePlayer = bestPath[bestPath.length - 1].currentTotalFlow
  const minFlowToConsider = bestFlowSinglePlayer * 0.5

  logger.log('make paths...')
  const timer1 = performance.now()

  const pathsStartVal: SimpleActionPath[] = []
  const paths = allPaths
    .slice()
    // Remove start valve
    .map(path => path.slice(1))
    .filter(
      path =>
        // assume no player visits the full amount of vaults as for the single player
        path.length < bestPath.length - 1 &&
        // assume each player visits at least 2 valves
        path.length >= 2 &&
        // assume individual paths are in the top 50%
        path[path.length - 1].currentTotalFlow >= minFlowToConsider
    )
    .reduce(
      (result, path) => [
        ...result,
        {
          valveNames: path.map(actionPath => actionPath.valveName),
          totalFlow: path[path.length - 1].currentTotalFlow,
        },
      ],
      pathsStartVal
    )
    .sort((a, b) => b.valveNames.length - a.valveNames.length)

  const timer2 = performance.now()
  console.log('so far, so good...')
  console.log(`Time so far: ${formatTimeDuration(timer1, timer2)}\n`)

  // todo: change any
  const visitedCache: Record<string, any> = {}

  const pairings: Pairing[] = []
  for (let i = 0; i < paths.length; i++) {
    const actionPath = paths[i]
    const valvesString = actionPath.valveNames.join(';')

    // compare against reversed order, since short paths match with long ones,
    // and vice versa
    for (let j = paths.length - 1; j >= 0; j--) {
      const otherActionPath = paths[j]
      const otherValvesString = otherActionPath.valveNames.join(';')

      if (
        otherActionPath.valveNames.some(name =>
          actionPath.valveNames.includes(name)
        ) ||
        otherActionPath.valveNames.length === 0
      ) {
        continue
      }

      if (
        visitedCache[valvesString]?.[otherValvesString] ||
        visitedCache[otherValvesString]?.[valvesString]
      ) {
        continue
      }
      if (!(valvesString in visitedCache)) {
        visitedCache[valvesString] = {}
      }
      else if (!visitedCache[valvesString][otherValvesString]) {
        // skip if there were already longer matches
        // const keys = Object.keys(visitedCache[valvesString])
        // for (let i = 0; i < keys.length; i++) {
        //   const str = keys[i]
        //   if (str.startsWith(otherValvesString)) {
        //     continue
        //   }
        // }
        visitedCache[valvesString][otherValvesString] = true
      }
      if (!(otherValvesString in visitedCache)) {
        visitedCache[otherValvesString] = {}
      }
      else if (!visitedCache[otherValvesString][valvesString]) {
        visitedCache[otherValvesString][valvesString] = true
      }

      const pairing: Pairing = {
        actions: [actionPath, otherActionPath],
        totalFlow: actionPath.totalFlow + otherActionPath.totalFlow,
      }
      pairings.push(pairing)
    }
  }

  const timer3 = performance.now()
  console.log('done combining')
  console.log(`Time so far: ${formatTimeDuration(timer1, timer3)}\n`)

  const bestPairing = pairings.sort((a, b) => b.totalFlow - a.totalFlow)[0]
  return bestPairing
}

/** Dijkstra search */
function analyzePaths(
  valves: ValveAnalyzed[],
  startingValve: ValveAnalyzed,
  maxTurns: number
): { bestPath: QueueState[]; allPaths: QueueState[][] } {
  const queueState: QueueState = {
    valveName: startingValve.name,
    currentTotalFlow: 0,
    timeLeft: maxTurns,
  }
  const startStateId = stringifyState(queueState)
  const frontier = new PriorityQueue<QueueState>()
  frontier.add(queueState, 0)
  const cameFrom: CameFromMap = {
    [startStateId]: null,
  }
  const costSoFar: Record<string, number> = {
    [startStateId]: 0,
  }
  let maxFlow = 0
  let bestPath: QueueState[] = []

  const relevantValves = getRemaining(valves)

  while (!frontier.empty()) {
    const current = frontier.get() as QueueState
    const currentValve = getByName(current.valveName, valves)
    const currentStateId = stringifyState(current)
    const pathSoFar = getPath(cameFrom, currentStateId)
    const neighbors = relevantValves.filter(valve =>
      pathSoFar.every(state => state.valveName !== valve.name)
    )

    if (current.currentTotalFlow > maxFlow) {
      maxFlow = current.currentTotalFlow
      bestPath = pathSoFar
    }

    neighbors.forEach(next => {
      const distance = getShortestDistance(currentValve, next)
      const openedByTurn = current.timeLeft - distance - 1
      if (openedByTurn < 0) return
      const nextPotential = next.potentialByRound[maxTurns - openedByTurn]
      const newTotalFlow = current.currentTotalFlow + nextPotential
      const nextQueueState: QueueState = {
        valveName: next.name,
        currentTotalFlow: newTotalFlow,
        timeLeft: openedByTurn,
      }
      const nextStateId = stringifyState(nextQueueState)

      if (
        !(nextStateId in costSoFar) ||
        newTotalFlow > costSoFar[nextStateId]
      ) {
        costSoFar[nextStateId] = newTotalFlow
        frontier.add(nextQueueState, newTotalFlow)
        cameFrom[nextStateId] = current
      }
    })
  }

  return {
    bestPath: bestPath,
    allPaths: Object.keys(cameFrom).map(stateId => getPath(cameFrom, stateId)),
  }
}

function getPath(cameFrom: CameFromMap, endingStateId: string): QueueState[] {
  // find shortest path from end till start
  const path: QueueState[] = [parseState(endingStateId)]
  let currentStateId: string | null = endingStateId
  while (true) {
    const prevState = cameFrom[currentStateId]
    if (prevState === null) break
    currentStateId = stringifyState(prevState)
    path.push(prevState)
  }
  return path.reverse()
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

function stringifyState(queueState: QueueState): string {
  const { valveName, currentTotalFlow, timeLeft } = queueState
  return `${valveName};${currentTotalFlow};${timeLeft}`
}

function parseState(queueStateId: string): QueueState {
  const [valveName, currentTotalFlow, timeLeft] = queueStateId.split(';')
  return {
    valveName,
    currentTotalFlow: Number(currentTotalFlow),
    timeLeft: Number(timeLeft),
  }
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

function formatTimeDuration(fromMs: number, toMs: number): string {
  return `${Math.round((toMs - fromMs) / 1000)}s`
}

function analyzeValves(valves: Valve[], maxTurns: number): ValveAnalyzed[] {
  return valves.map(valve => {
    const distances: DistanceMap = getDistances(valve)
    const potentialByRound = Array.from(Array(maxTurns))
      .map((_, i) => i)
      .reduce(
        (result, number) => ({
          ...result,
          [number]: valve.flowRate * (maxTurns - number),
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
