interface Solution18 {
  answer1: number
}
interface Cube {
  x: number
  y: number
  z: number
}

export default async function solution(input: string): Promise<Solution18> {
  const cubes = parseCubes(input)
  console.log(cubes)

  return { answer1: 0 }
}

function parseCubes(input: string): Cube[] {
  return input
    .split('\n')
    .map(line => line.split(',').map(str => Number(str)))
    .map(([x, y, z]) => ({ x, y, z }))
}
