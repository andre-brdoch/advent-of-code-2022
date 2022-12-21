interface Solution21 {
  answer1: number
  answer2: number
}
interface Humanoid {
  name: Name
  number?: number
  formula?: Formula
  cameFrom?: Humanoid
}
type Name = string
type Operator = '+' | '-' | '/' | '*'
interface Formula {
  operator: Operator
  leftOperand: Name
  rightOperand: Name
}

const MONKEY_BOSS = 'root'
const POOR_HUMAN = 'humn'

export default async function solution(input: string): Promise<Solution21> {
  const monkeys = parseMonkeys(input)
  const answer1 = resolveNumbersTill('root', monkeys)
  return { answer1 }
}

function resolveNumbersTill(name: Name, monkeys: Humanoid[]): number {
  const monkey = getByName(name, monkeys)
  if (monkey?.number !== undefined) return monkey.number
  else if (monkey?.formula) {
    const { leftOperand, rightOperand, operator } = monkey.formula
    const leftNumber = resolveNumbersTill(leftOperand, monkeys)
    const rightNumber = resolveNumbersTill(rightOperand, monkeys)
    monkey.number = calc(leftNumber, operator, rightNumber)
    return monkey.number
  }
  else throw new Error('Invalid monkey')
}

function getPath(humanoid: Humanoid): Humanoid[] {
  let current = humanoid
  const result: Humanoid[] = [current]
  while (current.cameFrom) {
    result.push(current.cameFrom)
    current = current.cameFrom
  }
  return result
}

function calc(left: number, operator: Operator, right: number): number {
  if (operator === '+') return left + right
  if (operator === '-') return left - right
  if (operator === '*') return left * right
  return left / right
}

function getByName(name: Name, monkeys: Humanoid[]): Humanoid | undefined {
  return monkeys.find(monkey => monkey.name === name)
}

function parseMonkeys(input: string): Humanoid[] {
  return input
    .split('\n')
    .map(line => line.split(': '))
    .map(([name, rest]) => {
      const result: Humanoid = { name }
      const maybeNumber = parseInt(rest, 10)
      if (!isNaN(maybeNumber)) result.number = maybeNumber
      else {
        const match = rest.match(/(\w+) ([+-/*]) (\w+)/)
        if (match === null) throw new Error('Useless monkey!')
        const [, leftOperand, operator, rightOperand] = match
        const formula = { leftOperand, operator, rightOperand }
        result.formula = formula as Formula
      }
      return result
    })
}
