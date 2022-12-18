interface Solution11 {
  answer1: number
}
interface MonkeyParsed {
  name: string
  items: number[]
  divisableBy: number
  activity: number
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
  Array.from(Array(20)).forEach(() => {
    playRound(monkeys)
  })
  const answer1 = getMonkeyBusiness(monkeys)

  return { answer1 }
}

function playRound(monkeys: Monkey[]): void {
  monkeys.forEach(monkey => {
    takeTurn(monkey)
  })
}

function takeTurn(monkey: Monkey): void {
  console.log(`--- Monkey ${monkey.name}`)

  const { items, inspect, divisableBy, targetA, targetB } = monkey
  items.forEach(item => {
    const itemInspected = inspect(item)
    monkey.activity += 1
    const itemRelieved = Math.floor(itemInspected / 3)
    const didPassTest = itemRelieved % divisableBy === 0
    const target = didPassTest ? targetA : targetB
    throwTo(target, itemRelieved)
  })
  monkey.items = []
}

function getMonkeyBusiness(monkeys: Monkey[]): number {
  const byActivity = monkeys
    .map(monkey => monkey.activity)
    .sort((a, b) => b - a)
    .slice(0, 2)
  console.log(byActivity)

  const [a, b] = byActivity
  return a * b
}

function throwTo(monkey: Monkey, item: number): void {
  console.log(`Throwing ${item} to ${monkey.name}`)
  monkey.items.push(item)
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
      activity: 0,
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
