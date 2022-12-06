import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function solution() {
  const file = await fs.readFile(
    path.join(__dirname, '../inputs/input-01.txt'),
    'utf8'
  )
  const bags = parseFile(file)
  const totalCaloriesByBag = bags.map(bag => getSum(bag))
  const answer1 = getSum(getNHighestNumbers(totalCaloriesByBag, 1))
  const answer2 = getSum(getNHighestNumbers(totalCaloriesByBag, 3))
  return { answer1, answer2 }
}

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
