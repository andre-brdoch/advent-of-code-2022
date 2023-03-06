import { SolutionFn } from '../types.js'

export default (async function solution(inputsFile) {
  const bags = parseFile(inputsFile)
  const totalCaloriesByBag = bags.map(bag => getSum(bag))
  const answer1 = getSum(getNHighestNumbers(totalCaloriesByBag, 1))
  const answer2 = getSum(getNHighestNumbers(totalCaloriesByBag, 3))
  return { answer1, answer2 }
} satisfies SolutionFn)

function parseFile(file: string): number[][] {
  return file
    .split('\n\n')
    .map(group => group.split('\n').map(line => Number(line)))
}

function getSum(numbers: number[]): number {
  return numbers.reduce((result, number) => result + number, 0)
}

function getNHighestNumbers(numbers: number[], n: number): number[] {
  return numbers.sort((a, b) => b - a).slice(0, n)
}
