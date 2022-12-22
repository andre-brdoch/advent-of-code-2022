interface Solution18 {
  answer1: number
}
interface Cube {
  x: number
  y: number
  z: number
}
type Axis = keyof Cube

const ALL_AXES: Axis[] = ['x', 'y', 'z']

export default async function solution(input: string): Promise<Solution18> {
  const cubes = parseCubes(input)
  const answer1 = getSurfaceArea(cubes)

  return { answer1 }
}

function getSurfaceArea(cubes: Cube[]): number {
  return cubes.reduce(
    (result, cube) => 6 - getNeighbors(cube, cubes).length + result,
    0
  )
}

function getNeighbors(cube: Cube, cubes: Cube[]): Cube[] {
  const otherCubes = cubes.filter(c => areAdjacent(cube, c))
  return otherCubes
}

function areAdjacent(a: Cube, b: Cube): boolean {
  return (
    areAdjacentOnAxis(a, b, 'x') ||
    areAdjacentOnAxis(a, b, 'y') ||
    areAdjacentOnAxis(a, b, 'z')
  )
}

function areAdjacentOnAxis(a: Cube, b: Cube, axis: Axis): boolean {
  const otherAxes: Axis[] = ALL_AXES.filter(otherAxis => otherAxis !== axis)
  return (
    Math.abs(a[axis] - b[axis]) === 1 &&
    otherAxes.every(otherAxis => a[otherAxis] === b[otherAxis])
  )
}

function parseCubes(input: string): Cube[] {
  return input
    .split('\n')
    .map(line => line.split(',').map(str => Number(str)))
    .map(([x, y, z]) => ({ x, y, z }))
}
