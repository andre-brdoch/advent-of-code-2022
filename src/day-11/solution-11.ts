interface Solution11 {
  answer1: number
}
interface Monkey {
  name: string
  items: number[]
  inspect: (item: number) => number
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
  const monkeys = input.split('\n\n').map(group => {
    const match = group.match(
      /(Monkey \d+):\n\s*Starting items: (.*)\n\s*Operation: new = (old|\d+) (.) (old|\d+)\n\s*Test: divisible by (\d+)/
    )

    if (match == null) throw new Error(`Invalid group: "${group}"`)
    const [
      ,
      name,
      itemsString,
      leftHand,
      operand,
      rightHand,
      divisableByString,
    ] = match

    const items = itemsString.split(', ').map(str => Number(str))
    const divisableBy = Number(divisableByString)

    const inspect = (item: number): number => {
      const left = leftHand === 'old' ? item : Number(leftHand)
      const right = rightHand === 'old' ? item : Number(rightHand)
      if (operand === '+') return left + right
      else if (operand === '*') return left * right
      throw new Error(`Invalid operand: "${operand}"`)
    }

    return {
      name,
      items,
      divisableBy,
      inspect,
    }
  })
  return monkeys
}
