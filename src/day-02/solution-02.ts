interface Solution2 {
  answer1: number
}
type Option = 'Rock' | 'Paper' | 'Scissors'
type Pair = [Option, Option]
type Outcome = 'win' | 'draw' | 'loss'
interface Map {
  [key: string]: Option
}

const translationMap: Map = {
  A: 'Rock',
  B: 'Paper',
  C: 'Scissors',
  X: 'Rock',
  Y: 'Paper',
  Z: 'Scissors',
}
const beatsMap: Map = {
  Rock: 'Scissors',
  Paper: 'Rock',
  Scissors: 'Paper',
}
const pointsMap: { [key: string]: number } = {
  Rock: 1,
  Paper: 2,
  Scissors: 3,
  win: 6,
  draw: 3,
  loss: 0,
}

export default async function (input: string): Promise<Solution2> {
  console.log(input)
  console.log('----');
  
  const pairs = parseOptions(input)
  console.log(pairs);
  const scores = pairs.map(pair => play(...pair))
  console.log(scores);
  
  const totalScore = getSum(scores)

  return { answer1: totalScore }
}

function play(a: Option, b: Option): number {
  const outcome = getOutcome(a, b)
  console.log(outcome)
  return pointsMap[b] + pointsMap[outcome]
}

function getOutcome(a: Option, b: Option): Outcome {
  return beatsMap[b] === a ? 'win' : a === b ? 'draw' : 'loss'
}

function getSum(numbers: number[]): number {
  return numbers.reduce((result, number) => (result += number), 0)
}

function parseOptions(input: string): Pair[] {
  return input.split('\n').map(line => line.split(' ').map(part => translationMap[part])) as Pair[]
}