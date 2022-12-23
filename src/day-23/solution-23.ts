interface Solution23 {
  answer1: number
}
interface Coordinate {
  x: number
  y: number
}
interface Elf {
  moveTo?: Coordinate
}
// map to look up elfs via y/x coordinates
interface Grid {
  [key: string]: {
    [key: string]: Elf
  }
}

export default async function solution(input: string): Promise<Solution23> {
  console.log(input)

  const { grid, elves } = parseFile(input)
  console.log(grid)

  return { answer1: 0 }
}

function parseFile(input: string): { grid: Grid; elves: Elf[] } {
  const grid: Grid = {}
  const elves: Elf[] = []

  input.split('\n').forEach((line, y) =>
    line.split('').forEach((char, x) => {
      if (char === '.') return
      const elf: Elf = {}
      elves.push(elf)

      if (!(y in grid)) {
        grid[y] = { [x]: elf }
      }
      else {
        grid[y][x] = elf
      }
    })
  )
  return { grid, elves }
}
