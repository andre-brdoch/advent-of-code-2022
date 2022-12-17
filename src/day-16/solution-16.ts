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
type Decision = 'move' | 'open'

const TURNS = 30

export default async function solution(input: string): Promise<Solution16> {
  console.log(input)
  console.log('----')

  const valves = parseValves(input)

  const current = getByName('AA', valves)
  console.log('current')
  console.log(current)
  const remaining = getClosed(valves)
  console.log('remaining')
  console.log(remaining)
  const d = getShortestDistance(current, getByName('HH', valves))
  console.log('d')
  console.log(d)
  const analyzedValves = analyzeValves(valves)
  console.log('analyzedValves')
  console.log(analyzedValves)

  //   const rated = remaining.map(valve => rateValve(valve, current))
  //   console.log('rated')
  //   console.log(rated)

  return { answer1: 0 }
}

// function rateValve(target: Valve, current: Valve): ValveRated {
//   //
// }

function getByName(name: string, valves: Valve[]): Valve
function getByName(name: string, valves: ValveParsed[]): ValveParsed
function getByName(
  name: string,
  valves: (Valve | ValveParsed)[]
): Valve | ValveParsed {
  const result = valves.find(valve => valve.name === name)

function getAllCombinations<V>(list: Array<V>): Array<Array<V>> {
  if (list.length === 1) return [list]
  else if (list.length === 2) return [list, [list[1], list[0]]]
  else {
    return list.flatMap(item => {
      return getAllCombinations(list.filter(el => el !== item)).map(y => [
        item,
        ...y,
      ])
    })
  }
}
  if (!result) throw new Error(`Valve with name "${name}" does not exist.`)
  return result
}

function getClosed(valves: Valve[]): Valve[] {
  return valves.filter(valve => !valve.open)
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

const hardcoded = {
  AA: {
    AA: 0,
    BB: 1,
    CC: 2,
    DD: 1,
    EE: 2,
    FF: 3,
    GG: 4,
    HH: 5,
    II: 1,
    JJ: 2,
  },
  BB: {
    AA: 1,
    BB: 0,
    CC: 1,
    DD: 2,
    EE: 3,
    FF: 4,
    GG: 5,
    HH: 6,
    II: 2,
    JJ: 3,
  },
  CC: {
    AA: 2,
    BB: 1,
    CC: 0,
    DD: 1,
    EE: 2,
    FF: 3,
    GG: 4,
    HH: 5,
    II: 3,
    JJ: 4,
  },
  DD: {
    AA: 1,
    BB: 2,
    CC: 1,
    DD: 0,
    EE: 1,
    FF: 2,
    GG: 3,
    HH: 4,
    II: 2,
    JJ: 3,
  },
  EE: {
    AA: 2,
    BB: 3,
    CC: 2,
    DD: 1,
    EE: 0,
    FF: 1,
    GG: 2,
    HH: 3,
    II: 3,
    JJ: 4,
  },
  FF: {
    AA: 3,
    BB: 4,
    CC: 3,
    DD: 2,
    EE: 1,
    FF: 0,
    GG: 1,
    HH: 2,
    II: 4,
    JJ: 5,
  },
  GG: {
    AA: 4,
    BB: 5,
    CC: 4,
    DD: 3,
    EE: 2,
    FF: 1,
    GG: 0,
    HH: 1,
    II: 5,
    JJ: 6,
  },
  HH: {
    AA: 5,
    BB: 6,
    CC: 5,
    DD: 4,
    EE: 3,
    FF: 2,
    GG: 1,
    HH: 0,
    II: 6,
    JJ: 7,
  },
  II: {
    AA: 1,
    BB: 2,
    CC: 3,
    DD: 2,
    EE: 3,
    FF: 4,
    GG: 5,
    HH: 6,
    II: 0,
    JJ: 1,
  },
  JJ: {
    AA: 2,
    BB: 3,
    CC: 4,
    DD: 3,
    EE: 4,
    FF: 5,
    GG: 6,
    HH: 7,
    II: 1,
    JJ: 0,
  },
}
function getShortestDistance(a: Valve, b: Valve): number {
  // TODO: implement Dijkstras algorithm to find shortest path to all other nodes

  // @ts-ignore
  return hardcoded[a.name][b.name]
}

function analyzeValves(valves: Valve[]): ValveAnalyzed[] {
  return valves.map(valve => {
    // @ts-ignore
    const distances: DistanceMap = hardcoded[valve.name]
    const potentialByRound = Array.from(Array(TURNS))
      .map((_, i) => i)
      .reduce(
        (result, number) => ({
          ...result,
          [number]: valve.flowRate * number,
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
