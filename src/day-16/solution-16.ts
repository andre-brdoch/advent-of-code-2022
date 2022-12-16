interface Solution16 {
  answer1: number
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
interface ValveRated extends Valve {
  distance: number
  potential: number
}
type Decision = 'move' | 'open'

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
  const d = getShortestDistance(current, getByName('BB', valves))
  console.log('d')
  console.log(d)

  // TODO: implement Dijkstras algorithm to find shortest path to all other nodes

  //   const rated = remaining.map(valve => rateValve(valve, current))
  //   console.log('rated')
  //   console.log(rated)

  return { answer1: 0 }
}

// function rateValve(target: Valve, current: Valve): ValveRated {
//   //
// }

function getShortestDistance(a: Valve, b: Valve): number {
  let count = 0
  count = 0
  if (a.neighbors.includes(b)) {
    return count + 1
  }
  return count
}

function getByName(name: string, valves: Valve[]): Valve
function getByName(name: string, valves: ValveParsed[]): ValveParsed
function getByName(
  name: string,
  valves: (Valve | ValveParsed)[]
): Valve | ValveParsed {
  const result = valves.find(valve => valve.name === name)
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
