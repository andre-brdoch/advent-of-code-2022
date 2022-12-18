interface Solution11 {
  answer1: number
  answer2: number
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
type ManageFrustrationFn = (item: number) => number

export default async function solution(input: string): Promise<Solution11> {
  const answer1 = getAnswer1(input)
  const answer2 = getAnswer2(input)

  return { answer1, answer2 }
}

function getAnswer1(input: string): number {
  const monkeys = parseMonkeys(input)
  const manageFrustration: ManageFrustrationFn = item => Math.floor(item / 3)
  playRounds(monkeys, 20, manageFrustration)
  return getMonkeyBusiness(monkeys)
}

function getAnswer2(input: string): number {
  const monkeys = parseMonkeys(input)
  const manageFrustration: ManageFrustrationFn = item => {
    const commonDividor = monkeys.reduce(
      (result, monkey) => result * monkey.divisableBy,
      1
    )
    return item % commonDividor
  }
  playRounds(monkeys, 10000, manageFrustration)
  return getMonkeyBusiness(monkeys)
}

function playRounds(
  monkeys: Monkey[],
  rounds: number,
  manageFrustration: ManageFrustrationFn
): void {
  Array.from(Array(rounds)).forEach(() => {
    monkeys.forEach(monkey => {
      takeTurn(monkey, manageFrustration)
    })
  })
}

function takeTurn(
  monkey: Monkey,
  manageFrustration: ManageFrustrationFn
): void {
  const { items, inspect, divisableBy, targetA, targetB } = monkey
  items.forEach(item => {
    let itemInspected = inspect(item)
    monkey.activity += 1
    itemInspected = manageFrustration(itemInspected)
    const didPassTest = itemInspected % divisableBy === 0
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

function throwTo(monkey: Monkey, item: number): void {
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
  // @ts-ignore
  return monkeys
}
