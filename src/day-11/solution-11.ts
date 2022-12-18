interface Solution11 {
  answer1: number
  answer2: number
}
interface MonkeyParsed {
  name: string
  items: bigint[]
  divisableBy: bigint
  activity: number
  inspect: (item: bigint) => bigint
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
  const answer1 = getAnswer1(input)
  const answer2 = getAnswer2(input)

  return { answer1, answer2 }
}

function getAnswer1(input: string): number {
  const monkeys = parseMonkeys(input)
  playRounds(monkeys, 20, true)
  return getMonkeyBusiness(monkeys)
}

function getAnswer2(input: string): number {
  const monkeys = parseMonkeys(input)
  playRounds(monkeys, 10, false)
  return getMonkeyBusiness(monkeys)
}

function playRounds(monkeys: Monkey[], rounds: number, easy: boolean): void {
  Array.from(Array(rounds)).forEach(() => {
    monkeys.forEach(monkey => {
      takeTurn(monkey, easy)
    })
  })
}

function takeTurn(monkey: Monkey, easy: boolean): void {
  const { items, inspect, divisableBy, targetA, targetB } = monkey
  items.forEach(item => {
    let itemInspected = inspect(item)
    monkey.activity += 1
    if (easy) {
      itemInspected = itemInspected / 3n
    }
    const didPassTest = itemInspected % divisableBy === 0n
    const target = didPassTest ? targetA : targetB
    throwTo(target, itemInspected)
  })
  monkey.items = []
}

function getMonkeyBusiness(monkeys: Monkey[]): number {
  const byActivity = monkeys
    .map(monkey => monkey.activity)
    .sort((a, b) => b - a)
  console.log(byActivity)

  const [a, b] = byActivity
  return a * b
}

function throwTo(monkey: Monkey, item: bigint): void {
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

function parseMonkeys(input: string): Monkey[] {
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

    const items = itemsString.split(', ').map(str => BigInt(str))
    const divisableBy = BigInt(divisableByString)

    const inspect = (item: bigint): bigint => {
      const left = leftHand === 'old' ? item : BigInt(leftHand)
      const right = rightHand === 'old' ? item : BigInt(rightHand)
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
  // @ts-ignore
  return monkeys
}
