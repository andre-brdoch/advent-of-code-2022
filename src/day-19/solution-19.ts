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
    console.log(turnToState(currentTurn))

    const nextTurns = getNextTurns(blueprint, currentTurn, cameFrom)
    nextTurns.forEach(nextTurn => {
      frontier.push(nextTurn)
      const nextTurnId = turnToState(nextTurn)
      cameFrom[nextTurnId] = currentTurn
    })
  }

  const best = Object.keys(cameFrom)
    .map(key => cameFrom[key])
    .flatMap(turn => (turn !== null ? [turn] : []))
    .sort((a, b) => b.finalStock.geode - a.finalStock.geode)[0]

  console.log('WINNER:')
  console.log(best.finalStock)

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

  return pruneNextTurns(blueprint, possibleTurns)
}

/** Reduces the set of next possible turns by removing nonsensical options */
function pruneNextTurns(blueprint: Blueprint, nextTurns: Turn[]): Turn[] {
  // TODO: if waited last turn for a robot that was buyable, do not buy it this turn either

  const prunedMaterials: Material[] = []
  const prunedTurns = nextTurns.reduce((result, turn) => {
    const isWaiting = turn?.buy === undefined

    if (isWaiting) {
      // dont wait if a robot of each material had been pruned (exep. highest prio):
      if (
        prunedMaterials.length > 0 &&
        prunedMaterials.length >=
          nextTurns.filter(
            turn =>
              turn?.buy !== undefined &&
              turn?.buy?.material !== MATERIALS_PRIORITIZED[0]
          ).length
      ) {
        console.log(nextTurns.length)
        console.log(prunedMaterials)

        console.log('each had been pruned')
        return result
      }

      console.log(nextTurns.length)

      // dont wait if every robot can be built:
      if (
        nextTurns.filter(turn => turn.buy !== undefined).length ===
        MATERIALS_PRIORITIZED.length
      ) {
        console.log('dont wait, can build every robot')
        return result
      }
    }
    // if buy turn for non-highest prio (we never prune highest prio material):
    else if (!isWaiting && turn?.buy?.material !== MATERIALS_PRIORITIZED[0]) {
      const buyRobot = turn.buy as RobotBlueprint
      const { material } = buyRobot
      const existingRobotsOfType = turn.finalRobots.filter(
        robot => robot.material === material
      )
      const blueprintRobots = (Object.keys(blueprint.robots) as Material[]).map(
        key => blueprint.robots[key]
      )
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
        prunedMaterials.push(buyRobot.material)
        return result
      }
    }

    return [...result, turn]
  }, [] as Turn[])

  return prunedTurns
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
