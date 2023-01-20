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
  CostSoFar,
} from './types'

const logger = new Logger()

const START_ROBOTS = [createRobot('ore')]
const MAX_TURNS = 24

const MATERIALS_PRIORITIZED: Material[] = ['geode', 'obsidian', 'clay', 'ore']

export default async function solution(input: string): Promise<Solution19> {
  const bps = parseBlueprints(input)
  const robots = [...START_ROBOTS]

  const startingTurn: Turn = {
    number: 1,
    finalRobots: robots,
    finalStock: getOutput(robots),
  }
  const turn2 = getNextTurns(bps[0], startingTurn, {})
  console.log('next possible turns:')
  console.log(turn2)
  const turn3 = getNextTurns(bps[0], turn2[0], {})
  console.log('next possible turns:')
  console.log(turn3)
  const turn4 = getNextTurns(bps[0], turn3[0], {})
  console.log('next possible turns:')
  console.log(turn4)
  const turn5 = getNextTurns(bps[0], turn4[0], {})
  console.log('next possible turns:')
  console.log(turn5)

  // const a = getQualityLevel(bps[0], robots)
  // console.log(bps[1].robots.ore.costs)
  // console.log(bps[1].robots.clay.costs)
  // console.log(bps[1].robots.obsidian.costs)
  // console.log(bps[1].robots.geode.costs)

  // const b = getQualityLevel(bps[0], robots)

  logger.log('\n')
  return { answer1: 0 }
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

  while (frontier.length !== 0) {
    const currentTurn = frontier.shift() as Turn
    // const nextTurns = getNextTurns()
  }

  return []
}
function getNextTurns(
  blueprint: Blueprint,
  currentTurn: Turn,
  cameFrom: CameFrom
): Turn[] {
  const {
    number: oldNumber,
    finalRobots: oldRobots,
    finalStock: oldStock,
  } = currentTurn
  const possibleActions = [...MATERIALS_PRIORITIZED, null]
  const output = getOutput(oldRobots)

  return (
    possibleActions
      // TODO: add pruning to remove senseless options
      .map(action => {
        const nextTurn: Turn = {
          finalRobots: [...oldRobots],
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
          nextTurn.finalRobots = [...oldRobots, createRobot(material)]
          nextTurn.finalStock = sumMaterialAmounts(nextTurn.finalStock, output)
        }
        return nextTurn
      })
      // filter out null
      .flatMap(turn => (turn !== null ? [turn] : []))
  )
}

function getQualityLevel(
  blueprint: Blueprint,
  startingRobots: Robot[]
): number {
  const sequence = findBestSequence(blueprint, startingRobots)
  const amount =
    sequence[sequence.length - 1].finalStock[MATERIALS_PRIORITIZED[0]]

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
  return [robots, stock, buy].join(';')
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
