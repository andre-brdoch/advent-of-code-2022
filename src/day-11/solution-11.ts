interface Solution11 {
  answer1: number
}
interface Monkey {
  name: string
  items: number[]
  inspection: () => number
  divisableBy: number
  targetA: Monkey
  targetB: Monkey
}

export default async function solution(input: string): Promise<Solution11> {
  console.log(input)
  console.log('----')

  const monkeys = parseMonkeys(input)
  console.log(monkeys)

  return { answer1: 0 }
}

function parseMonkeys(input: string): any {
  return input.split('\n\n').map(group => {
    const parts = group.split('\n').map(line => line.trim())
    const name = parts[0].replace(':', '')
    const items = parts[1]
      .replace(/Starting items:\s/, '')
      .split(', ')
      .map(str => Number(str))
    const formula = parts[2].split('new =').pop()
    const divisableBy = Number(parts[3].split('by ').pop())
    return {
      name,
      items,
      divisableBy,
    }
  })
}
