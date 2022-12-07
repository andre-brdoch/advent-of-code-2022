import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , day, mode] = process.argv

if (!day) {
  throw new Error('No day selected')
}

const dayFormatted = day.padStart(2, '0')
const isTest = mode === 'test'

async function getInputFile(): Promise<string | undefined> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  try {
    const filePath = path.join(
      __dirname,
      `./day-${dayFormatted}/input-${isTest ? 'test-' : ''}${dayFormatted}.txt`
    )
    const file = await fs.readFile(filePath, 'utf8')
    return file
  }
  catch (err) {
    return undefined
  }
}

function printAnswers(answer1: unknown, answer2: unknown): void {
  console.log(`Solution 1 for day ${day} is:`)
  console.log(answer1, isTest ? '(TEST)' : '')

  if (answer2 !== undefined) {
    console.log(`...and solution 2 is:`)
    console.log(answer2, isTest ? '(TEST)' : '')
  }
}

const solutionModule = await import(
  `./day-${dayFormatted}/solution-${dayFormatted}.js`
)
const inputsFile = await getInputFile()

const { answer1, answer2 } = await solutionModule.default(inputsFile)

printAnswers(answer1, answer2)
