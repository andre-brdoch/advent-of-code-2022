import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
;(async function run() {
  const day = getFormattedDay()
  console.log(`Running solution for day ${day}...`)
  const solutionModule = await import(`./days/day-${day}.js`)
  const inputsFile = await getInputFile()
  const { answer1, answer2 } = await solutionModule.default(inputsFile)

  console.log(`Solution 1 for day ${day} is:`)
  console.log(answer1)

  if (answer2 !== undefined) {
    console.log(`...and solution 2 is:`)
    console.log(answer2)
  }
})()

async function getInputFile(): Promise<string | undefined> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const day = getFormattedDay()

  try {
    const filePath = path.join(__dirname, `./inputs/input-${day}.txt`)
    const file = await fs.readFile(filePath, 'utf8')
    return file
  } catch (err) {
    return undefined
  }
}

function getFormattedDay(): string {
  const [, , day] = process.argv
  if (!day) {
    throw new Error('No day selected')
  }
  return day.padStart(2, '0')
}
