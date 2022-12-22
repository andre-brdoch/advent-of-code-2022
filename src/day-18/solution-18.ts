interface Solution18 {
  answer1: number
}
interface Cube {
  x: number
  y: number
  z: number
  type: 'lava' | 'air' | 'water' | 'unknown'
}
type Axis = keyof Omit<Cube, 'type'>
type Grid = Cube[][][]

const ALL_AXES: Axis[] = ['x', 'y', 'z']

export default async function solution(input: string): Promise<Solution18> {
  const cubes = parseCubes(input)
  const answer1 = getSurfaceArea(cubes)

  const grid = buildGrid(cubes)
  grid.forEach(row => console.log(row))

  return { answer1 }
}

function buildGrid(cubes: Cube[]): Grid {
  const { maxX, maxY, maxZ, minX, minY, minZ } = getBoundingCube(cubes)
  const grid: Grid = []
  for (let x = minX; x < maxX; x++) {
    const row = []
    for (let y = minY; y < maxY; y++) {
      const column = []
      for (let z = minZ; z < maxZ; z++) {
        let cube = cubes.find(
          cube => cube.x === x && cube.y === y && cube.z === z
        )
        if (!cube) cube = { x, y, z, type: 'unknown' }
        column.push(cube)
      }
      row.push(column)
    }
    grid.push(row)
  }
  return grid
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

function getBoundingCube(cubes: Cube[]): {
  maxX: number
  maxY: number
  maxZ: number
  minX: number
  minY: number
  minZ: number
} {
  let maxX: number | null = null
  let maxY: number | null = null
  let maxZ: number | null = null
  let minX: number | null = null
  let minY: number | null = null
  let minZ: number | null = null
  cubes.forEach(({ x, y, z }) => {
    if (maxX === null || x > maxX) maxX = x
    if (maxY === null || y > maxY) maxY = y
    if (maxZ === null || z > maxZ) maxZ = z
    if (minX === null || x < minX) minX = x
    if (minY === null || y < minY) minY = y
    if (minZ === null || z < minZ) minZ = z
  })
  console.log(`max: ${maxX}/${maxY}/${maxZ}`)
  console.log(`min: ${minX}/${minY}/${minZ}`)
  if (
    maxX === null ||
    maxY === null ||
    maxZ === null ||
    minX === null ||
    minY === null ||
    minZ === null
  ) {
    throw new Error('No bounding cube found')
  }
  return {
    maxX,
    maxY,
    maxZ,
    minX,
    minY,
    minZ,
  }
}

function parseCubes(input: string): Cube[] {
  return input
    .split('\n')
    .map(line => line.split(',').map(str => Number(str)))
    .map(([x, y, z]) => ({ x, y, z, type: 'lava' }))
}
