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
  leftOperand: Name | number
  rightOperand: Name | number
}

export default async function solution(input: string): Promise<Solution21> {
  const monkeys = parseMonkeys(input)
  console.log(monkeys)

  return { answer1: 0 }
}

function parseMonkeys(input: string): any {
  return input
    .split('\n')
    .map(line => line.split(': '))
    .map(([name, rest]) => {
      const result: Monkey = { name }
      console.log(name, rest)

      const maybeNumber = parseInt(rest, 10)
      if (!isNaN(maybeNumber)) result.number = maybeNumber
      else {
        console.log(rest)
        const match = rest.match(/(\w+) ([+-/*]) (\w+)/)
        console.log(match)

        if (match === null) throw new Error('Useless monkey!')
        const [, leftOperand, operator, rightOperand] = match
        const formula = { leftOperand, operator, rightOperand }
        result.formula = formula as Formula
      }
      return result
    })
}
