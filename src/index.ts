import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './utils/env-helpers.js'

const { day, file, cliInput, isTest, visualize } = parseArgs()

if (!day) {
  throw new Error('No day selected')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dayFormatted = String(day).padStart(2, '0')

async function getInputFile(): Promise<string | undefined> {
  try {
    const filePath = path.join(__dirname, `./day-${dayFormatted}/${file}`)
    const input = await fs.readFile(filePath, 'utf8')
    return input
  }
  catch (err) {
    return undefined
  }
}

function printAnswers(answer1: unknown, answer2: unknown): void {
  console.log(`Solution 1 for day ${day} is:`)
  console.log(answer1, isTest ? '(TEST)' : '')

  if (answer2 !== undefined) {
    console.log('...and solution 2 is:')
    console.log(answer2, isTest ? '(TEST)' : '')
  }
}

async function fileExists(path: string): Promise<boolean> {
  return !!(await fs.stat(path).catch(() => false))
}

async function toFile(fileName: string, data: string): Promise<void> {
  const dir = path.join(__dirname, `./day-${dayFormatted}/output`)
  if (!(await fileExists(dir))) {
    await fs.mkdir(dir)
  }
  const file = path.join(dir, fileName)
  await fs.writeFile(file, data)
}

const solutionModule = await import(
  `./day-${dayFormatted}/solution-${dayFormatted}.js`
)
const inputs = cliInput ?? (await getInputFile())

const { answer1, answer2, visualFile, visualData } =
  await solutionModule.default(inputs, {
    isTest,
    visualize,
  })

printAnswers(answer1, answer2)

if (visualize && visualFile && visualData) {
  await toFile(visualFile, visualData)
}
