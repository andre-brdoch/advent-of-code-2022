interface Solution16 {
  answer1: number
}
interface Valve {
  name: string
  flowRate: number
  neighborNames: string[]
}

export default async function solution(input: string): Promise<Solution16> {
  console.log(input)
  console.log('----')

  const valves = parseValves(input)
  console.log(valves)

  return { answer1: 0 }
}

function parseValves(input: string): Valve[] {
  return input.split('\n').map(line => {
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
}
