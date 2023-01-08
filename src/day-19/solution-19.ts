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
} from './types'

const logger = new Logger()

const START_ROBOTS = [createRobot('ore')]
const MATERIAL_TO_MAXIMIZE = 'geode'
const MAX_TURNS = 24

export default async function solution(input: string): Promise<Solution19> {
  const bps = parseBlueprints(input)
  // console.log(bps[0].robots.ore)
  // console.log(bps[0].robots.geode)
  const robots = [...START_ROBOTS]
  // const output = getOutput(robots)
  // logger.log('\nOutput:')
  // logger.log(output)
  // logger.log('\nOutput in 3 turns:')
  // logger.log(getOutput(robots, 3))

  // const turn: Turn = {
  //   number: 0,
  //   finalRobots: [
  //     createRobot('ore'),
  //     // createRobot('clay'),
  //     // createRobot('obsidian'),
  //     // createRobot('obsidian'),
  //   ],
  //   // buy: bps[0].robots.clay,
  //   finalStock: {
  //     ore: 1,
  //     clay: 1,
  //     obsidian: 0,
  //     geode: 0,
  //   },
  // }
  // logger.log(stringifyTurn(turn))
  // const next = getNextPossibleBuyTurns(bps[0], turn)
  // logger.log('\n Next options:')
  // logger.log(next)

  // const id = turnToId(turn)
  // logger.log(id)
  // logger.log(idToTurn(bps[0], id))

  const sequence = findBestSequence(bps[0], robots)
  logger.log('\nBest sequence:')
  logger.log(sequence)

  logger.log('\n')
  return { answer1: 0 }
}

function findBestSequence(
  blueprint: Blueprint,
  startingRobots: Robot[]
): Sequence {
  const frontier = new PriorityQueue<Turn>()
  const firstTurn: Turn = {
    finalRobots: startingRobots,
    finalStock: getOutput(startingRobots),
    number: 1,
  }
  const firstTurnId = turnToId(firstTurn)
  frontier.add(firstTurn, 0)
  const cameFrom: CameFrom = {
    [firstTurnId]: null,
  }
  // tracks amount of collected resources which is being maximized
  const collectedSoFar: { [turnId: string]: number } = {
    [firstTurnId]: 0,
  }

  let max = 0
  let bestSequence: Sequence = []

  while (!frontier.empty()) {
    const current = frontier.get() as Turn
    const currentId = turnToId(current)
    console.log(currentId)

    const nextOptions = getNextPossibleBuyTurns(blueprint, current)

    const amount = current?.finalStock?.[MATERIAL_TO_MAXIMIZE]
    if (amount && amount > max) {
      max = amount
      bestSequence = buildPath(blueprint, cameFrom, currentId)
    }

    nextOptions.forEach(next => {
      const nextId = turnToId(next)
      // TODO: get actual amount
      // const NEW_AMOUNT = 0
      if (!(nextId in cameFrom)) {
        cameFrom[nextId] = current
        // collectedSoFar[nextId] = NEW_AMOUNT
        frontier.add(next, 0)
      }
    })
  }

  return bestSequence
}

// TODO: refactor using the same newStock loop for all robots
function getNextPossibleBuyTurns(
  blueprint: Blueprint,
  currentTurn: Turn
): Turn[] {
  const currentRobots = currentTurn.finalRobots
  const output = getOutput(currentRobots)
  const nextTurns: Turn[] = (Object.keys(blueprint.robots) as Material[])
    .map(material => blueprint.robots[material])
    .map(robot => {
      if (robot.costs.some(([costName]) => output[costName] === 0)) {
        // not purchasable with current robots
        return null
      }
      let turnsToWait = 0
      let newStock: MaterialAmounts | undefined = undefined
      while (true) {
        turnsToWait += 1

        const isTooLate = turnsToWait + currentTurn.number > MAX_TURNS
        if (isTooLate) {
          return null
        }

        newStock = sumMaterialAmounts(
          newStock ?? currentTurn.finalStock,
          output
        )

        const costsAreCovered = robot.costs.every(
          ([costMaterial, costAmount]) =>
            (newStock as MaterialAmounts)[costMaterial] >= costAmount
        )
        if (costsAreCovered) {
          newStock = applyCostsToMaterialAmounts(newStock, robot.costs)
          break
        }
      }

      return {
        finalRobots: [...currentRobots, createRobot(robot.material)],
        finalStock: newStock,
        buy: robot,
        number: currentTurn.number + turnsToWait,
      }
    })
    // filter out null
    .flatMap(robot => (robot !== null ? [robot] : []))
  return nextTurns
}

function buildPath(
  blueprint: Blueprint,
  cameFrom: CameFrom,
  lastTurnId: string
): Sequence {
  const path: Sequence = [idToTurn(blueprint, lastTurnId)]
  let currentId: string | null = lastTurnId
  while (true) {
    const prevTurn = cameFrom[currentId]
    if (prevTurn === null) break
    currentId = turnToId(prevTurn)
    path.push(prevTurn)
  }
  return path.reverse()
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

/** Creates a unique string ID from a given turn */
function turnToId(turn: Turn): string {
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

/** Converts a turn ID back to a turn object */
function idToTurn(blueprint: Blueprint, id: string): Turn {
  const [numStr, robotsStr, stockStr, buyStr] = id.split(';')
  const number = Number(numStr)
  const finalRobots = (robotsStr.split(',') as Material[]).map(createRobot)
  const finalStock = stockStr.split(',').reduce((result, materialPair) => {
    const [material, amountStr] = materialPair.split('=')
    return {
      ...result,
      [material]: Number(amountStr),
    }
  }, {} as MaterialAmounts)
  const result: Turn = { number, finalRobots, finalStock }
  if (buyStr !== 'null') {
    result.buy = blueprint.robots[buyStr as Material]
  }
  return result
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
      name,
      robots,
    }
    return bp
  })
}

class PriorityQueue<T> {
  private items: {
    item: T
    priority: number
  }[]

  constructor() {
    this.items = []
  }

  public add(item: T, priority: number) {
    this.items.push({ item, priority })
  }

  public get() {
    if (this.empty()) return null
    const highestPrio = this.items.sort((a, b) => b.priority - a.priority)[0]
    const i = this.items.indexOf(highestPrio)
    this.items.splice(i, 1)
    return highestPrio.item
  }

  public empty() {
    return this.items.length === 0
  }
}
