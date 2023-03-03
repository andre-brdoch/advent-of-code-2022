import { Logger } from '../utils/Logger.js'

import {
  Solution16,
  DistanceMap,
  PotentialMap,
  ValveParsed,
  Valve,
  ValveAnalyzed,
  CameFromMap,
  QueueState,
  SimpleActionPath,
  Pairing,
} from './types'

const START_NAME = 'AA'

const logger = new Logger()

export default async function solution(input: string): Promise<Solution16> {
  const timer1 = performance.now()

  const valves = parseValves(input)
  const answer1 = getAnswer1(valves)
  const answer2 = getAnswer2(valves)

  const timer2 = performance.now()
  console.log(`Solved in: ${formatTimeDuration(timer1, timer2)}\n`)

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
  withElephant = false,
  log = true
): number {
  let totalFlow
  let msg

  if (!withElephant) {
    const { bestPath } = analyzePaths(valves, startingValve, maxTurns)
    if (bestPath.length === 0) return 0
    totalFlow = bestPath[bestPath.length - 1].currentTotalFlow
    msg = `---- Single Player:\nBest path is ${bestPath
      .map(v => v.valveName)
      .join(' -> ')}, resulting in a total flow of ${totalFlow}.\n`
  }
  else {
    const bestPairing = findBestPairing(valves, startingValve, maxTurns)
    const [player, elephant] = bestPairing.actions
    totalFlow = bestPairing.totalFlow
    msg = `---- Multi Player:\nPlayer visits ${player.valveNames.join(
      ' -> '
    )} (${player.totalFlow}),\nElephant visits  ${elephant.valveNames.join(
      ' -> '
    )}, (${elephant.totalFlow})\n`
  }

  if (log) logger.log(msg)
  return totalFlow
}

function findBestPairing(
  valves: ValveAnalyzed[],
  startingValve: ValveAnalyzed,
  maxTurns: number
): Pairing {
  const { allPaths } = analyzePaths(valves, startingValve, maxTurns)

  const pairings: Pairing[] = []
  const pathsById: { [id: string]: SimpleActionPath[] } = {}
  const bestPathById: { [id: string]: SimpleActionPath } = {}
  const pairedIds: { [id: string]: string } = {}

  allPaths.forEach(path => {
    const valveNames = path
      // remove starting valve, since both players start at same point
      .slice(1)
      .map(({ valveName }) => valveName)
    // create ID by sorting alphabetically
    const id = valveNames.sort().join(',')

    if (valveNames.length === 0) return

    const item: SimpleActionPath = {
      valveNames,
      totalFlow: path[path.length - 1].currentTotalFlow,
    }

    // group together paths with identical valves (but differing order) under the same cache key
    if (!(id in pathsById)) {
      pathsById[id] = [item]
    }
    else {
      pathsById[id].push(item)
    }
  })

  Object.keys(pathsById).forEach(id => {
    bestPathById[id] = pathsById[id].sort(
      (a, b) => b.totalFlow - a.totalFlow
    )[0]
  })

  const allValveNames = valves.map(({ name }) => name)
  Object.keys(bestPathById).forEach(id => {
    const names = id.split(',')
    const otherId = allValveNames
      .filter(name => !names.includes(name))
      .sort()
      .slice(1)
      .join(',')
    pairedIds[id] = otherId
  })

  const remainingKeys = Object.keys(pairedIds).filter(
    // assume every player visits at least 2 valves
    id => (id.match(/,/g) || []).length > 1
  )
  remainingKeys.forEach(id => {
    const valveNames = id.split(',')
    const otherId = pairedIds[id]
    const otherValveNames = otherId.split(',')
    const otherValves = valves.filter(valve =>
      otherValveNames.includes(valve.name)
    )
    const otherValvesWithStart = [startingValve, ...otherValves]
    let otherTotal
    if (otherId in bestPathById) {
      otherTotal = bestPathById[otherId].totalFlow
      // dont check the same pair again:
      remainingKeys.splice(remainingKeys.indexOf(otherId), 1)
    }
    else {
      // this is very slow, takes ~100 seconds with production data.
      // but one only has so much time for this (:
      otherTotal = getHighestFlowRate(
        otherValvesWithStart,
        startingValve,
        maxTurns,
        false,
        false
      )
    }

    const action = {
      valveNames: valveNames,
      totalFlow: bestPathById[id].totalFlow,
    }
    const otherAction = { valveNames: otherValveNames, totalFlow: otherTotal }
    const pairing: Pairing = {
      actions: [action, otherAction],
      totalFlow: action.totalFlow + otherAction.totalFlow,
    }
    pairings.push(pairing)
  })

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

  const relevantValves = valves.filter(
    valve => typeof valve?.flowRate === 'number' && valve.flowRate > 0
  )

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
  let current: Valve

  while (frontier.length) {
    current = frontier.shift() as Valve
    current.neighbors.forEach(next => {
      if (!(next.name in distances)) {
        frontier.push(next)
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
