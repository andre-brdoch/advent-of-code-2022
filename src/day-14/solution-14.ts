interface Solution14 {
  answer1: number
}
type Air = '.'
type Rock = '#'
type Sand = '+'
type Cell = Air | Rock | Sand
type Cave = Cell[][]
interface Coordinate {
  x: number
  y: number
}
type Path = Coordinate[]

export default async function solution(input: string): Promise<Solution14> {
  console.log(input)
  console.log('---')

  const paths = parsePaths(input)
  console.log(paths)

  return { answer1: 0 }
}

function parsePaths(input: string): Path[] {
  return input.split('\n').map(line =>
    line.split(' -> ').map(coordinatesString => {
      const [x, y] = coordinatesString.split(',')
      return { x: Number(x), y: Number(y) }
    })
  )
}
