interface Solution21 {
  answer1: number
}
interface Monkey {
  name: Name
  number?: number
  formula?: Formula
}
type Name = string
type Operator = '+' | '-' | '/' | '*'
interface Formula {
  operator: Operator
  leftOperand: Name
  rightOperand: Name
}

export default async function solution(input: string): Promise<Solution21> {
  const monkeys = parseMonkeys(input)
  const answer1 = resolveNumbersTill('root', monkeys)
  return { answer1 }
}

function resolveNumbersTill(name: Name, monkeys: Monkey[]): number {
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

function calc(left: number, operator: Operator, right: number): number {
  if (operator === '+') return left + right
  if (operator === '-') return left - right
  if (operator === '*') return left * right
  return left / right
}

function getByName(name: Name, monkeys: Monkey[]): Monkey | undefined {
  return monkeys.find(monkey => monkey.name === name)
}

function parseMonkeys(input: string): Monkey[] {
  return input
    .split('\n')
    .map(line => line.split(': '))
    .map(([name, rest]) => {
      const result: Monkey = { name }
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
