interface Solution15 {
  answer1: number
}
interface Coordinates {
  x: number
  y: number
}
interface Beacon extends Coordinates {
  type: 'beacon'
}
interface Sensor extends Coordinates {
  closestBeacon: Beacon
  type: 'sensor'
}

export default async function solution(input: string): Promise<Solution15> {
  console.log(input)
  console.log('----')

  const sensors = parseSensors(input)
  console.log(sensors)

  return { answer1: 0 }
}

function parseSensors(input: string): Sensor[] {
  return input
    .split('\n')
    .map(line =>
      line
        .replace('Sensor at ', '')
        .split(': closest beacon is at ')
        .map(parseCoordinates)
    )
    .map(([sensor, beacon]) => ({
      ...sensor,
      type: 'sensor',
      closestBeacon: {
        ...beacon,
        type: 'beacon',
      },
    }))
}

function parseCoordinates(string: string): Coordinates {
  return string
    .replace('x=', '')
    .replace('y=', '')
    .split(', ')
    .map(str => Number(str))
    .reduce(
      (result, axis, i) => ({
        ...result,
        [i === 0 ? 'x' : 'y']: axis,
      }),
      {} as Coordinates
    )
}
