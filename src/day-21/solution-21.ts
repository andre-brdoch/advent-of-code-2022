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
  const humanoidsPt1 = parseHumanoids(input)
  const answer1 = resolveNumbersTill(MONKEY_BOSS, humanoidsPt1)

  const humanoidsPt2 = parseHumanoids(input)
  const answer2 = await screamProperNumber(humanoidsPt2)

  console.log(resolveFormulaTo(100, '+', 25, null))
  console.log(resolveFormulaTo(100, '+', null, 25))
  console.log(resolveFormulaTo(100, '*', 25, null))
  console.log(resolveFormulaTo(100, '*', null, 25))
  console.log(resolveFormulaTo(100, '-', 25, null))
  console.log(resolveFormulaTo(100, '-', null, 25))
  console.log(resolveFormulaTo(100, '/', 200, null))
  console.log(resolveFormulaTo(100, '/', null, 200))

  return { answer1, answer2 }
}

async function screamProperNumber(humanoids: Humanoid[]): Promise<number> {
  let resolve: (monkey: Humanoid) => void
  const waitForOtherCalculations: Promise<Humanoid> = new Promise(resolveFn => {
    resolve = resolveFn
  })
  async function resolveNumbersTill2(
    name: Name,
    humanoids: Humanoid[],
    cameFrom: Humanoid | null
  ): Promise<number> {
    const humanoid = getByName(name, humanoids)
    if (humanoid === undefined) {
      throw new Error(`Humanoid "${name} does not exist.`)
    }
    if (cameFrom) humanoid.cameFrom = cameFrom
    const pathToRoot = getPath(humanoid)
    const root = pathToRoot[pathToRoot.length - 1]
    if (name === POOR_HUMAN) {
      console.log(
        'Human here, waiting for the other part of the calculation...\n'
      )
      const otherMonkey = await waitForOtherCalculations
      const firstAncestor = pathToRoot[pathToRoot.length - 2]
      firstAncestor.number = otherMonkey.number
      console.log(
        `Monkey "${otherMonkey.name}" had number ${otherMonkey.number}.`
      )
      console.log(
        `Need to find number to scream, so that monkey "${firstAncestor.name}" also has number ${otherMonkey.number}...\n`
      )

      const { leftOperand: leftMonkey, rightOperand: rightMonkey } =
        root.formula ?? {}
      if (leftMonkey === undefined || rightMonkey === undefined) {
        throw new Error('Boss monkey must have a formula')
      }
    }
    if (humanoid.number !== undefined) return humanoid.number
    else if (humanoid.formula) {
      const { leftOperand, rightOperand, operator } = humanoid.formula
      const [leftNumber, rightNumber] = await Promise.all([
        resolveNumbersTill2(leftOperand, humanoids, humanoid),
        resolveNumbersTill2(rightOperand, humanoids, humanoid),
      ])
      humanoid.number = calc(leftNumber, operator, rightNumber)
      // if direct children of root monkey
      if (pathToRoot.length === 2) {
        resolve(humanoid)
      }
      return humanoid.number
    }
    else throw new Error('Invalid monkey')
  }
  return resolveNumbersTill2('root', humanoids, null)
}

function resolveNumbersTill(name: Name, humanoids: Humanoid[]): number {
  const humanoid = getByName(name, humanoids)
  if (humanoid?.number !== undefined) return humanoid.number
  else if (humanoid?.formula) {
    const { leftOperand, rightOperand, operator } = humanoid.formula
    const leftNumber = resolveNumbersTill(leftOperand, humanoids)
    const rightNumber = resolveNumbersTill(rightOperand, humanoids)
    humanoid.number = calc(leftNumber, operator, rightNumber)
    return humanoid.number
  }
  else throw new Error('Invalid humanoid')
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

function resolveFormulaTo(
  result: number,
  operator: Operator,
  left: number | null,
  right: number | null
): number {
  const leftIsUnknown = !isNotNull(left)
  const rightIsUnknown = !isNotNull(right)
  const known = leftIsUnknown ? right : left
  if (!isNotNull(known) || (!leftIsUnknown && !rightIsUnknown)) {
    throw new Error('Formula can not be resolved.')
  }
  switch (operator) {
  case '*':
    return result / known
  case '-':
    return known === right ? result + known : (result - known) * -1
  case '/':
    return known === right ? result * known : known / result
  case '+':
  default:
    return result - known
  }
}

function calc(left: number, operator: Operator, right: number): number {
  if (operator === '+') return left + right
  if (operator === '-') return left - right
  if (operator === '*') return left * right
  return left / right
}

function isNotNull<T>(val: T | null): val is T {
  return val !== null
}

function getByName(name: Name, humanoids: Humanoid[]): Humanoid | undefined {
  return humanoids.find(monkey => monkey.name === name)
}

function parseHumanoids(input: string): Humanoid[] {
  return input
    .split('\n')
    .map(line => line.split(': '))
    .map(([name, rest]) => {
      const result: Humanoid = { name }
      const maybeNumber = parseInt(rest, 10)
      if (!isNaN(maybeNumber)) result.number = maybeNumber
      else {
        const match = rest.match(/(\w+) ([+-/*]) (\w+)/)
        if (match === null) throw new Error('Invalid humanoid!')
        const [, leftOperand, operator, rightOperand] = match
        const formula = { leftOperand, operator, rightOperand }
        result.formula = formula as Formula
      }
      return result
    })
}
