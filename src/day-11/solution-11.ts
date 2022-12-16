interface Solution11 {
  answer1: number
}
interface MonkeyParsed {
  name: string
  items: number[]
  divisableBy: number
  inspect: (item: number) => number
  targetAName?: string
  targetBName?: string
  targetA?: Monkey | MonkeyParsed
  targetB?: Monkey | MonkeyParsed
}
interface Monkey extends MonkeyParsed {
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

function getByName<T>(name: string, items: T[]): T {
  const result = items.find(
    item =>
      item != null &&
      typeof item === 'object' &&
      'name' in item &&
      item.name === name
  )
  if (!result) throw new Error(`Monkey with name "${name}" does not exist.`)
  return result
}

function capitalizeFirstChar(string: string): string {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`
}

function parseMonkeys(input: string): any {
  const monkeys: MonkeyParsed[] = input.split('\n\n').map(group => {
    const match = group.match(
      /(Monkey \d+):\n\s*Starting items: (.*)\n\s*Operation: new = (old|\d+) (.) (old|\d+)\n\s*Test: divisible by (\d+)\n\s*If true: throw to (.*)\n\s*If false: throw to (.*)/
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
      targetAName,
      targetBName,
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
      targetAName: capitalizeFirstChar(targetAName),
      targetBName: capitalizeFirstChar(targetBName),
    }
  })
  monkeys.forEach(monkey => {
    monkey.targetA = getByName(monkey.targetAName ?? '', monkeys)
    monkey.targetB = getByName(monkey.targetBName ?? '', monkeys)
  })
  return monkeys
}
