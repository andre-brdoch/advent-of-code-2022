import { Logger } from '../utils/Logger.js'
import {
  Solution19,
  Material,
  Cost,
  Robot,
  RobotBlueprint,
  Blueprint,
  MaterialAmounts,
  Turn,
  Sequence,
  CameFrom,
  NextOptionsCache,
  CostSoFar,
} from './types'

const logger = new Logger()

const START_ROBOTS = [createRobot('ore')]

const MATERIALS_PRIORITIZED: Material[] = ['geode', 'obsidian', 'clay', 'ore']
const BEST_MATERIAL = MATERIALS_PRIORITIZED[0]

export default async function solution(input: string): Promise<Solution19> {
  const timer1 = performance.now()

  // const answer1 = 0
  const answer1 = getAnswer1(input)
  const answer2 = 0
  // const answer2 = getAnswer2(input)

  const timer2 = performance.now()
  console.log(`Done after ${formatTimeDuration(timer1, timer2)}\n`)

  return { answer1, answer2 }
}

function getAnswer2(input: string): number {
  const bps = parseBlueprints(input)
  const maxTurns = 32

  // const s = findBestSequence(bps[0], START_ROBOTS, maxTurns)
  // console.log(stringifySequence(s))

  const bestAmounts = bps
    .slice(0, 3)
    .map(bp => findBestSequence(bp, START_ROBOTS, maxTurns))
    .map(sequence => sequence[sequence.length - 1].finalStock[BEST_MATERIAL])
  console.log(bestAmounts)

  return bestAmounts.reduce((result, amount) => result * amount, 1)
}

function getAnswer1(input: string): number {
  const bps = parseBlueprints(input)
  const maxTurns = 32

  const s = findBestSequence(bps[0], START_ROBOTS, maxTurns)
  console.log(stringifySequence(s))

  return 0
  // getTotalQuality(bps, START_ROBOTS, maxTurns)
}

function findBestSequence(
  blueprint: Blueprint,
  startingRobots: Robot[],
  maxTurns: number
): Sequence {
  const startingTurn: Turn = {
    number: 1,
    finalRobots: startingRobots,
    finalStock: getOutput(startingRobots),
  }
  const startTurnId = turnToState(startingTurn)

  const frontier = [startingTurn]
  const cameFrom: CameFrom = { [startTurnId]: null }
  const nextOptionsCache: NextOptionsCache = {}
  let bestTurn: Turn | undefined = undefined
  let pathsVisited = 0

  while (frontier.length > 0) {
    pathsVisited += 1
    const currentTurn = frontier.pop() as Turn
    const currentTurnId = turnToState(currentTurn)

    // console.log(turnToState(currentTurn))

    if (
      bestTurn === undefined ||
      currentTurn.finalStock[BEST_MATERIAL] > bestTurn.finalStock[BEST_MATERIAL]
    ) {
      bestTurn = currentTurn
    }

    const nextTurns = getNextTurns(blueprint, currentTurn, bestTurn, maxTurns)
    nextOptionsCache[currentTurnId] = nextTurns

    nextTurns.forEach(nextTurn => {
      const nextTurnId = turnToState(nextTurn)
      if (!(nextTurnId in nextOptionsCache)) {
        cameFrom[nextTurnId] = currentTurn
        frontier.push(nextTurn)
      }
    })
  }

  if (!bestTurn) throw new Error('No best turn determined!')

  console.log('WINNER:')
  console.log(bestTurn)
  console.log(bestTurn?.finalStock)
  console.log('\n==== Amount of paths visited:', pathsVisited, '====\n')

  return buildSequence(cameFrom, bestTurn)
}
function getNextTurns(
  blueprint: Blueprint,
  currentTurn: Turn,
  bestTurnYet: Turn | undefined,
  maxTurns: number
): Turn[] {
  const { number: oldNumber, finalRobots: oldRobots } = currentTurn
  if (oldNumber >= maxTurns) return []

  const output = getOutput(oldRobots)

  const possibleTurns = MATERIALS_PRIORITIZED.map(material => {
    const robot = blueprint.robots[material]
    if (robot.costs.some(([costName]) => output[costName] === 0)) {
      // not purchasable with current robots
      return null
    }

    let turnsToWait = 0
    let newStock: MaterialAmounts = { ...currentTurn.finalStock }
    let costsAreCovered = false

    while (!costsAreCovered) {
      turnsToWait += 1

      const isTooLate = turnsToWait + currentTurn.number > maxTurns - 1
      if (isTooLate) {
        return null
      }

      costsAreCovered = robot.costs.every(
        ([costMaterial, costAmount]) =>
          (newStock as MaterialAmounts)[costMaterial] >= costAmount
      )

      newStock = sumMaterialAmounts(newStock, output)
    }
    newStock = applyCostsToMaterialAmounts(newStock, robot.costs)

    return {
      finalRobots: [...oldRobots, createRobot(robot.material)],
      finalStock: newStock,
      buy: robot,
      number: currentTurn.number + turnsToWait,
    }
  })
    // filter out null
    .flatMap(turn => (turn !== null ? [turn] : []))

  const pruned = pruneNextTurns(
    blueprint,
    possibleTurns,
    currentTurn,
    bestTurnYet,
    maxTurns
  )

  // add final wait turn
  if (pruned.length === 0 && currentTurn.number < maxTurns) {
    const { finalRobots, finalStock, number } = currentTurn
    const newStock = sumMaterialAmounts(
      finalStock,
      getOutput(finalRobots, maxTurns - number)
    )
    const finalTurn: Turn = {
      finalRobots: finalRobots,
      finalStock: newStock,
      number: maxTurns,
    }
    pruned.push(finalTurn)
  }

  return pruned
}

/** Reduces the set of next possible turns by removing nonsensical options */
function pruneNextTurns(
  blueprint: Blueprint,
  nextTurns: Turn[],
  currentTurn: Turn,
  bestTurnYet: Turn | undefined,
  maxTurns: number
): Turn[] {
  // dont continue if it is impossible catch up with best turn so far,
  // assuming we add another robot of the best material every turn
  const remainingTurns = maxTurns - currentTurn.number
  const currentBest = bestTurnYet?.finalStock[BEST_MATERIAL] ?? 0
  const currentStock = currentTurn?.finalStock[BEST_MATERIAL] ?? 0

  const hypotheticalBest =
    currentStock +
    getOutput(currentTurn.finalRobots, remainingTurns)[BEST_MATERIAL] +
    hypotheticallyAddRobotsTillEnd(remainingTurns)
  if (hypotheticalBest <= currentBest) {
    return []
  }

  const prunedTurns = nextTurns.reduce((result, turn) => {
    // if buy turn for non-highest prio (we never prune highest prio material):
    if (turn?.buy?.material !== BEST_MATERIAL) {
      const buyRobot = turn.buy as RobotBlueprint
      const { material } = buyRobot
      const existingRobotsOfType = turn.finalRobots.filter(
        robot => robot.material === material
      )
      const blueprintRobots = (Object.keys(blueprint.robots) as Material[]).map(
        key => blueprint.robots[key]
      )

      // dont build robots in last turn
      if (turn.number === maxTurns) {
        return result
      }
      // only build best material robots in 2nd and 3rd last turn
      if (turn.number >= maxTurns - 2 && material !== BEST_MATERIAL) {
        return result
      }
      //  only build robots that fullfill costs for best material robot in 4th and 5th last turn
      if (
        turn.number >= maxTurns - 4 &&
        ![
          BEST_MATERIAL,
          ...blueprint.robots[BEST_MATERIAL].costs.map(
            ([costMaterial]) => costMaterial
          ),
        ].includes(material)
      ) {
        return result
      }

      if (
        // dont buy if current robots already produce every turn enough
        // to pay for the most expensive cost:
        !blueprintRobots.some(
          bpRobot =>
            existingRobotsOfType.length <=
            (bpRobot.costs.find(
              ([costMaterial]) => costMaterial === material
            ) ?? [material, 0])[1]
        )
      ) {
        return result
      }
    }

    return [...result, turn]
  }, [] as Turn[])

  return prunedTurns
}

function buildSequence(cameFrom: CameFrom, lastTurn: Turn): Sequence {
  const lastTurnId = turnToState(lastTurn)
  const sequence: Sequence = [lastTurn]
  let currentId: string | null = lastTurnId
  while (true) {
    const prevTurn = cameFrom[currentId]
    if (prevTurn === null) break
    currentId = turnToState(prevTurn)
    sequence.push(prevTurn)
  }
  return sequence.reverse()
}

function getTotalQuality(
  blueprints: Blueprint[],
  startingRobots: Robot[],
  maxTurns: number
): number {
  const qualities = blueprints.map(bp =>
    getQualityLevel(bp, startingRobots, maxTurns)
  )
  console.log(qualities)
  return qualities.reduce((result, num) => result + num, 0)
}

function getQualityLevel(
  blueprint: Blueprint,
  startingRobots: Robot[],
  maxTurns: number
): number {
  const sequence = findBestSequence(blueprint, startingRobots, maxTurns)
  const amount = sequence[sequence.length - 1].finalStock[BEST_MATERIAL]

  const qualityLevel = amount * blueprint.id

  logger.log(`The best sequence for blueprint ${blueprint.id} is:`)
  logger.log(sequence.map(stringifyTurn).join('\n'))
  logger.log(
    `\nThe quality level of blueprint ${blueprint.id} is: ${qualityLevel}`
  )

  return qualityLevel
}

function getOutput(robots: Robot[], turns = 1): MaterialAmounts {
  const start: Record<Material, number> = {
    ore: 0,
    clay: 0,
    obsidian: 0,
    geode: 0,
  }
  return robots.reduce((result, robot) => {
    result[robot.material] += turns
    return result
  }, start)
}

function sumMaterialAmounts(
  a: MaterialAmounts,
  b: MaterialAmounts
): MaterialAmounts {
  return (Object.keys(a) as Material[]).reduce(
    (result, material) => ({
      ...result,
      [material]: a[material] + b[material],
    }),
    {} as MaterialAmounts
  )
}

function applyCostsToMaterialAmounts(
  materialAmounts: MaterialAmounts,
  costs: Cost[]
): MaterialAmounts {
  const result = { ...materialAmounts }
  costs.forEach(([costMaterial, costAmount]) => {
    result[costMaterial] -= costAmount
  })
  return result
}

function countRobotsByMaterial(robots: Robot[], material: Material): number {
  return robots.filter(robot => robot.material === material).length
}

const hypotheticallyAddRobotsTillEnd = (function closure() {
  const cache: { [n: number]: number } = {}
  return (remainingTurns: number): number => {
    if (remainingTurns in cache) return cache[remainingTurns]
    const result = Array.from(Array(remainingTurns)).reduce(
      (result, _, i) => result + i,
      0
    )
    cache[remainingTurns] = result
    return result
  }
})()

/** Creates unique ID from a given turn */
function turnToState(turn: Turn): string {
  const robots = turn.finalRobots.map(robot => robot.material).join(',')
  const stock = (Object.keys(turn.finalStock) as Material[])
    .reduce(
      (result, material) => [
        ...result,
        `${material}=${turn.finalStock[material]}`,
      ],
      [] as string[]
    )
    .join(',')
  const buy = turn.buy?.material ?? 'null'
  return [turn.number, robots, stock, buy].join(';')
}

function createRobot(material: Material): Robot {
  return { material }
}

function stringifyTurn(turn: Turn): string {
  const { finalRobots, finalStock, buy, number } = turn
  let str = `\n== Minute ${number} ==`
  if (buy) {
    str += `\nSpends ${buy.costs
      .map(([material, amount]) => `${amount} ${material}`)
      .join(' and ')} to start building a ${buy.material} robot.`
  }
  ;(Object.keys(finalStock) as Material[]).forEach(material => {
    let amount = countRobotsByMaterial(finalRobots, material)
    if (material === buy?.material) amount -= 1
    const hasRobots = amount > 0
    const hasMaterial = finalStock[material] > 0
    if (hasRobots || hasMaterial) str += '\n'
    if (hasRobots) {
      str += `${amount} ${material} robot${amount === 1 ? '' : 's'} collect${
        amount === 1 ? 's' : ''
      } ${amount} ${material}; `
    }
    if (hasMaterial) {
      str += `You now have ${finalStock[material]} ${material}.`
    }
  })
  if (buy) {
    str += `\nThe new ${buy.material} robot is ready; `
    str += `You now have ${countRobotsByMaterial(
      finalRobots,
      buy.material
    )} of them.`
  }
  return str
}

function stringifySequence(sequence: Sequence): string {
  return sequence.map(stringifyTurn).join('\n')
}

function formatTimeDuration(fromMs: number, toMs: number): string {
  return `${Math.round((toMs - fromMs) / 1000)}s`
}

function parseBlueprints(input: string): Blueprint[] {
  return input.split('\n').map(line => {
    const [name, robotInfos] = line.split(':')
    // 'Blueprint 1' -> 1
    const id = Number(name.split(' ')[1])
    const robots: Record<Material, RobotBlueprint> = robotInfos
      // 'Blueprint 1: Each ore robot costs 4 ore. Each obsidian robot costs 3 ore and 14 clay.'
      .split('.')
      // remove empty
      .filter(str => str)
      // " Each obsidian robot costs 3 ore and 14 clay"
      .reduce((result, robotInfo) => {
        const [intro, costsString] = robotInfo.split(' costs ')
        // " Each ore robot" -> "ore"
        const targetMaterial = intro
          .replace(/^ Each /, '')
          .replace(/ robot$/, '') as Material
        // "costs 3 ore and 14 clay" -> [['ore', 3], ['clay', 14]]
        const costs: Cost[] = costsString.split(' and ').map(str => {
          const [costStr, material] = str.split(' ') as [string, Material]
          return [material, Number(costStr)]
        })
        const robot: RobotBlueprint = { material: targetMaterial, costs }
        return {
          ...result,
          [targetMaterial]: robot,
        }
      }, {} as Record<Material, RobotBlueprint>)
    const bp: Blueprint = {
      id,
      robots,
    }
    return bp
  })
}
