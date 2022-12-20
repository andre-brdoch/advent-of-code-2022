import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface Flags {
  isTest?: boolean
  // test file name
  file?: string
  // input passed directly via CLI
  cliInput?: string
  visualize?: boolean
}
interface Args extends Flags {
  day: number
}

const { day, file, cliInput, isTest, visualize } = parseArgs()

if (!day) {
  throw new Error('No day selected')
}

const dayFormatted = String(day).padStart(2, '0')

async function getInputFile(): Promise<string | undefined> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  try {
    const filePath = path.join(__dirname, `./day-${dayFormatted}/${file}`)
    const input = await fs.readFile(filePath, 'utf8')
    return input
  }
  catch (err) {
    return undefined
  }
}

function parseArgs(): Args {
  const args = process.argv
  const flagMap: Flags = args
    .map(str => str.match(/^--(\w+)=(.+)$/))
    .filter(match => match !== null)
    .reduce((result, match) => {
      const [, name, value] = match as RegExpMatchArray
      const convertedValue =
        value === 'true' ? true : value === 'false' ? false : value
      return {
        ...result,
        [name]: convertedValue,
      }
    }, {})
  const result = {
    day: Number(args[2]),
    ...flagMap,
  }
  if (flagMap.file?.includes('test')) {
    result.isTest = true
  }
  return result
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
const inputs = cliInput ?? (await getInputFile())

const { answer1, answer2 } = await solutionModule.default(inputs, {
  isTest,
  visualize,
})

printAnswers(answer1, answer2)
