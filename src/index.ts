import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , day] = process.argv
if (!day) {
  throw new Error('No day selected')
}
const dayFormatted = day.padStart(2, '0')
const solutionModule = await import(`./days/day-${dayFormatted}.js`)
const inputsFile = await getInputFile()

const { answer1, answer2 } = await solutionModule.default(inputsFile)

console.log(`Solution 1 for day ${day} is:`)
console.log(answer1)

if (answer2 !== undefined) {
  console.log(`...and solution 2 is:`)
  console.log(answer2)
}

async function getInputFile(): Promise<string | undefined> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  try {
    const filePath = path.join(__dirname, `./inputs/input-${dayFormatted}.txt`)
    const file = await fs.readFile(filePath, 'utf8')
    return file
  }
  catch (err) {
    return undefined
  }
}
