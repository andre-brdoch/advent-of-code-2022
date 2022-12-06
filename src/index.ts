const [, , day] = process.argv

if (!day) {
  throw new Error('No day selected')
}

;(async function run() {
  const solutionModule = await import(`./days/day-${day.padStart(2, '0')}.js`)
  solutionModule.default()
})()
