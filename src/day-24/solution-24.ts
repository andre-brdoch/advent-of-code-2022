interface Solution24 {
  answer1: number
}
type Blizzard = '^' | '>' | 'v' | '<'
type Wall = '#'
type Player = 'E'
type Empty = '.'
type Cell = Blizzard | Wall | Player | Empty
type Grid = Cell[][]

export default async function solution(input: string): Promise<Solution24> {
  const grid = parseGrid(input)
  console.log(grid)

  return { answer1: 0 }
}

function parseGrid(input: string): Grid {
  return input.split('\n').map(line => line.split('') as Cell[])
}
