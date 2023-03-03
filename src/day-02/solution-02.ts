import { Solution2, Sign, Option, Outcome, Map } from './types'

const enemyOptionsMap: Map<Option> = {
  A: 'Rock',
  B: 'Paper',
  C: 'Scissors',
}
const myOptionsMap: Map<Option> = {
  X: 'Rock',
  Y: 'Paper',
  Z: 'Scissors',
}
const outcomesMap: Map<Outcome> = {
  X: 'loss',
  Y: 'draw',
  Z: 'win',
}
const beatsMap: Map<Option> = {
  Rock: 'Scissors',
  Paper: 'Rock',
  Scissors: 'Paper',
}
const beatenByMap: Map<Option> = Object.keys(beatsMap).reduce(
  (result, key) => ({
    ...result,
    [beatsMap[key]]: key,
  }),
  {}
)
const pointsMap: Map<number> = {
  Rock: 1,
  Paper: 2,
  Scissors: 3,
  win: 6,
  draw: 3,
  loss: 0,
}

export default async function (input: string): Promise<Solution2> {
  const signPairs = parseFile(input)
  const answer1 = getAnswer1(signPairs)
  const answer2 = getAnswer2(signPairs)

  return { answer1, answer2 }
}

function getAnswer1(signPairs: Sign[][]): number {
  const optionPairs = signsToOptions(signPairs)
  const scores = optionPairs.map(([a, b]) => play(a, b))
  return getSum(scores)
}

function getAnswer2(signPairs: Sign[][]): number {
  const pairs = signsToOutcomes(signPairs)
  const scores = pairs.map(([enemyOption, outcome]) =>
    playForOutcome(enemyOption, outcome)
  )
  return getSum(scores)
}

function playForOutcome(enemyOption: Option, outcome: Outcome): number {
  const myOption = getOptionForOutcome(enemyOption, outcome)
  return pointsMap[myOption] + pointsMap[outcome]
}

function play(enemyOption: Option, myOption: Option): number {
  const outcome = getOutcome(enemyOption, myOption)
  return pointsMap[myOption] + pointsMap[outcome]
}

function getOptionForOutcome(enemyOption: Option, outcome: Outcome): Option {
  let myOption: Option
  if (outcome === 'loss') {
    myOption = beatsMap[enemyOption]
  }
  else if (outcome === 'draw') {
    myOption = enemyOption
  }
  else {
    myOption = beatenByMap[enemyOption]
  }
  return myOption
}

function getOutcome(enemyOption: Option, myOption: Option): Outcome {
  return beatsMap[myOption] === enemyOption
    ? 'win'
    : enemyOption === myOption
      ? 'draw'
      : 'loss'
}

function getSum(numbers: number[]): number {
  return numbers.reduce((result, number) => (result += number), 0)
}

function signsToOptions(signPairs: Sign[][]): Option[][] {
  return signPairs.map(pair =>
    pair.map((sign, i) => (i === 0 ? enemyOptionsMap : myOptionsMap)[sign])
  )
}

function signsToOutcomes(signPairs: Sign[][]): [Option, Outcome][] {
  return signPairs.map(
    pair =>
      pair.map(
        (sign, i) => (i === 0 ? enemyOptionsMap : outcomesMap)[sign]
      ) as [Option, Outcome]
  )
}

function parseFile(input: string): Sign[][] {
  return input.split('\n').map(line => line.split(' ')) as Sign[][]
}
