const [, , day] = process.argv

if (!day) {
  throw new Error('No day selected')
}

;(async function run() {
  console.log(`Running solution for day ${day}...`)
  const solutionModule = await import(`./days/day-${day.padStart(2, '0')}.js`)
  const { answer1, answer2 } = await solutionModule.default()

  console.log(`Solution 1 for day ${day} is:`)
  console.log(answer1)

  if (answer2 !== undefined) {
    console.log(`...and solution 2 is:`)
    console.log(answer2)
  }
})()
