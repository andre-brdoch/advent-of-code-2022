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
const MAX_TURNS = 24

const MATERIALS_PRIORITIZED: Material[] = ['geode', 'obsidian', 'clay', 'ore']
const BEST_MATERIAL = MATERIALS_PRIORITIZED[0]

export default async function solution(input: string): Promise<Solution19> {
  const timer1 = performance.now()

  const bps = parseBlueprints(input)
  const sequence = findBestSequence(bps[1], START_ROBOTS)

  logger.log(stringifySequence(sequence))

  // const answer1 = getTotalQuality(bps, START_ROBOTS)
  const answer1 = 0

  // const q = getQualityLevel(bps[0], START_ROBOTS)
  // console.log(q)

  const timer2 = performance.now()
  console.log(`Done after ${formatTimeDuration(timer1, timer2)}`)

  logger.log('\n')
  return { answer1 }
}

function findBestSequence(
  blueprint: Blueprint,
  startingRobots: Robot[]
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

  while (frontier.length > 0) {
    const currentTurn = frontier.pop() as Turn
    const currentTurnId = turnToState(currentTurn)

    // console.log(turnToState(currentTurn))

    if (
      bestTurn === undefined ||
      currentTurn.finalStock[BEST_MATERIAL] > bestTurn.finalStock[BEST_MATERIAL]
    ) {
      bestTurn = currentTurn
    }

    const nextTurns = getNextTurns(
      blueprint,
      currentTurn,
      bestTurn,
      cameFrom,
      nextOptionsCache
    )
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

  return buildSequence(cameFrom, bestTurn)
}
function getNextTurns(
  blueprint: Blueprint,
  currentTurn: Turn,
  bestTurnYet: Turn | undefined,
  cameFrom: CameFrom,
  nextOptionsCache: NextOptionsCache
): Turn[] {
  const {
    number: oldNumber,
    finalRobots: oldRobots,
    finalStock: oldStock,
  } = currentTurn
  if (oldNumber >= MAX_TURNS) return []

  const output = getOutput(oldRobots)

  const possibleTurns = [...MATERIALS_PRIORITIZED, null]
    .map(action => {
      const nextTurn: Turn = {
        finalRobots: [...oldRobots.map(robot => ({ ...robot }))],
        finalStock: { ...oldStock },
        number: oldNumber + 1,
      }
      if (action === null) {
        // is waiting
        nextTurn.finalStock = sumMaterialAmounts(oldStock, output)
      }
      else {
        const material = action
        // apply costs and add robot
        const { costs } = blueprint.robots[material]
        let tooExpensive = false
        costs.forEach(([costMaterial, costAmount]) => {
          nextTurn.finalStock[costMaterial] -= costAmount
          if (nextTurn.finalStock[costMaterial] < 0) {
            tooExpensive = true
          }
        })
        if (tooExpensive) {
          return null
        }
        nextTurn.buy = blueprint.robots[material]
        nextTurn.finalRobots = [...nextTurn.finalRobots, createRobot(material)]
        nextTurn.finalStock = sumMaterialAmounts(nextTurn.finalStock, output)
      }
      return nextTurn
    })
    // filter out null
    .flatMap(turn => (turn !== null ? [turn] : []))

  return pruneNextTurns(
    blueprint,
    possibleTurns,
    currentTurn,
    bestTurnYet,
    cameFrom,
    nextOptionsCache
  )
}

/** Reduces the set of next possible turns by removing nonsensical options */
function pruneNextTurns(
  blueprint: Blueprint,
  nextTurns: Turn[],
  currentTurn: Turn,
  bestTurnYet: Turn | undefined,
  cameFrom: CameFrom,
  nextOptionsCache: NextOptionsCache
): Turn[] {
  const currentTurnId = turnToState(currentTurn)
  const prevTurn = cameFrom[currentTurnId]
  const prevTurnId = prevTurn ? turnToState(prevTurn) : ''
  const prevOptions = nextOptionsCache[prevTurnId] ?? []
  const prunedMaterials: Material[] = []

  // building a robot has no effect in last turn, just wait:
  if (currentTurn.number >= MAX_TURNS) {
    return [{ ...currentTurn, buy: undefined }]
  }
  // in 2nd last turn, only building best material and waiting makes sense:
  if (currentTurn.number === MAX_TURNS - 1) {
    return nextTurns.filter(
      turn => turn.buy === undefined || turn.buy?.material === BEST_MATERIAL
    )
  }

  // dont continue if it is impossible catch up with best turn so far,
  // assuming we add another robot of the best material every turn
  const remainingTurns = MAX_TURNS - currentTurn.number
  const currentBest = bestTurnYet?.finalStock[BEST_MATERIAL] ?? 0
  const currentStock = currentTurn?.finalStock[BEST_MATERIAL] ?? 0
  const hypotheticalBest =
    currentStock +
    getOutput(currentTurn.finalRobots)[BEST_MATERIAL] +
    Array.from(Array(remainingTurns)).reduce((result, _, i) => result + i, 0)

  if (hypotheticalBest <= currentBest) {
    return nextTurns.filter(turn => turn.buy === undefined)
  }

  const prunedTurns = nextTurns.reduce((result, turn) => {
    const isWaiting = turn?.buy === undefined

    if (isWaiting) {
      // dont wait if a robot of each material had been pruned (exep. highest prio):
      if (
        prunedMaterials.length > 0 &&
        prunedMaterials.length >= MATERIALS_PRIORITIZED.slice(1).length
      ) {
        return result
      }

      // dont wait if every robot can be built:
      if (
        nextTurns.filter(turn => turn.buy !== undefined).length ===
        MATERIALS_PRIORITIZED.length
      ) {
        return result
      }
    }
    // if buy turn for non-highest prio (we never prune highest prio material):
    else if (!isWaiting && turn?.buy?.material !== BEST_MATERIAL) {
      const buyRobot = turn.buy as RobotBlueprint
      const { material } = buyRobot
      const existingRobotsOfType = turn.finalRobots.filter(
        robot => robot.material === material
      )
      const blueprintRobots = (Object.keys(blueprint.robots) as Material[]).map(
        key => blueprint.robots[key]
      )

      // in the last few turns, only build robots that can
      // possibly still lead to best material:
      if (
        MAX_TURNS - currentTurn.number <= MATERIALS_PRIORITIZED.length &&
        MATERIALS_PRIORITIZED.indexOf(material) >
          MAX_TURNS - currentTurn.number - 1
      ) {
        prunedMaterials.push(material)
        return result
      }

      // dont buy if it was possible last turn, but instead it waited:
      if (
        prevTurn !== null &&
        prevTurn.buy === undefined &&
        prevOptions.some(turn => turn.buy?.material === material)
      ) {
        prunedMaterials.push(material)
        // console.log('useless wait\n')

        return result
      }

      if (
        // dont buy if current robots already produce every turn enough
        // to pay for the most expensive cost:
        blueprintRobots.every(
          bpRobot =>
            existingRobotsOfType.length >
            (bpRobot.costs.find(
              ([costMaterial]) => costMaterial === material
            ) ?? [material, 0])[1]
        )
      ) {
        prunedMaterials.push(material)
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
  startingRobots: Robot[]
): number {
  const qualities = blueprints.map(bp => getQualityLevel(bp, startingRobots))
  console.log(qualities)
  return qualities.reduce((result, num) => result + num, 0)
}

function getQualityLevel(
  blueprint: Blueprint,
  startingRobots: Robot[]
): number {
  const sequence = findBestSequence(blueprint, startingRobots)
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
