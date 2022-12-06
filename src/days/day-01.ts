import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type Calories = number
type Bag = Calories[]

export default async function solution() {
  const file = await fs.readFile(
    path.join(__dirname, '../inputs/input-01.txt'),
    'utf8'
  )
  const bags = parseFile(file)
  const totalCaloriesByBag = bags.map(bag => getSum(bag))
  const highest = getHighestNumber(totalCaloriesByBag)
  return highest
}

function parseFile(file: string): Bag[] {
  return file
    .split('\n\n')
    .map(group => group.split('\n').map(line => Number(line)))
}

function getSum(numbers: number[]): number {
  return numbers.reduce((result, number) => result + number, 0)
}

function getHighestNumber(numbers: number[]): number {
  return numbers.sort((a, b) => b - a)?.[0] ?? 0
}
