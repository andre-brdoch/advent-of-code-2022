const [, , day] = process.argv

if (!day) {
  throw new Error('No day selected')
}

;(async function run() {
  console.log(`Running solution for day ${day}...`)
  const solutionModule = await import(`./days/day-${day.padStart(2, '0')}.js`)
  const solution = await solutionModule.default()
  console.log(`Solution for day ${day} is:`)
  console.log(solution)
})()
