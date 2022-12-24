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
  console.log(stringifyGrid(grid))

  return { answer1: 0 }
}

function stringifyGrid(grid: Grid): string {
  let string = ''
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      const sign = grid[x][y]
      string += sign
    }
    string += '\n'
  }
  return string
}

function parseGrid(input: string): Grid {
  return input.split('\n').map(line => line.split('') as Cell[])
}
