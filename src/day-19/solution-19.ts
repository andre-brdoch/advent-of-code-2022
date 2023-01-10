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

  // const a = getQualityLevel(bps[0], robots)
  // console.log(bps[1].robots.ore.costs)
  // console.log(bps[1].robots.clay.costs)
  // console.log(bps[1].robots.obsidian.costs)
  // console.log(bps[1].robots.geode.costs)

  const b = getQualityLevel(bps[0], robots)

  logger.log('\n')
  return { answer1: 0 }
}

function getQualityLevel(
  blueprint: Blueprint,
  startingRobots: Robot[]
): number {
  const buySequence = findBestSequence(blueprint, startingRobots)
  const sequence = addNonBuyTurnsToSequence(buySequence)
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

function findBestSequence(
  blueprint: Blueprint,
  startingRobots: Robot[]
): Sequence {
  const startingTurn: Turn = {
    number: 1,
    finalRobots: startingRobots,
    finalStock: getOutput(startingRobots),
  }
  let currentTurnNumber = 0
  const robotTypes = new Set(startingRobots.map(robot => robot.material))
  const totalSequence: Sequence = [startingTurn]
  // one at a time, find the shortest path to the next level material:
  while (currentTurnNumber < MAX_TURNS) {
    let nextMaterial = MATERIALS_PRIORITIZED.slice()
      .reverse()
      .find(material => !robotTypes.has(material)) as Material | undefined

    // if all robots exist at least once, concentrate on highest value one:
    if (nextMaterial === undefined) {
      const highestValue = MATERIALS_PRIORITIZED[0]
      nextMaterial = highestValue
    }

    const sequence = findShortestSequenceTo(
      blueprint,
      nextMaterial,
      totalSequence[totalSequence.length - 1]
    )
    if (sequence === null) {
      break
    }
    console.log(sequence)

    sequence.forEach(turn => {
      if (!turn.buy) return
      robotTypes.add(turn.buy.material)
    })
    // dont re-add previously last turn
    totalSequence.push(...sequence.slice(1))
    currentTurnNumber = totalSequence[sequence.length - 1].number
  }

  return totalSequence
}

function findShortestSequenceTo(
  blueprint: Blueprint,
  targetMaterial: Material,
  prevTurn: Turn
): Sequence | null {
  const frontier = new PriorityQueue<Turn>()
  const prevTurnId = turnToState(prevTurn)
  frontier.add(prevTurn, 0)
  const cameFrom: CameFrom = {
    [prevTurnId]: null,
  }
  const costSoFar: CostSoFar = {
    [prevTurnId]: prevTurn.number,
  }

  let bestLastTurn: Turn | undefined = undefined

  while (!frontier.empty()) {
    const currentTurn = frontier.get() as Turn

    if (
      currentTurn.buy?.material === targetMaterial &&
      // prevent early exit if starting robot type equals the target's one
      Object.keys(cameFrom).length > 1
    ) {
      bestLastTurn = currentTurn
      console.log(bestLastTurn)

      break
    }

    const nextOptions = getNextPossibleBuyTurns(blueprint, currentTurn)
    nextOptions.forEach(nextTurn => {
      const nextId = turnToState(nextTurn)
      const newCost = nextTurn.number
      if (!(nextId in costSoFar || newCost < costSoFar[nextId])) {
        costSoFar[nextId] = newCost
        cameFrom[nextId] = currentTurn
        frontier.add(nextTurn, newCost)
      }
    })
  }

  if (bestLastTurn === undefined) {
    return null
  }

  const sequence = buildSequence(cameFrom, bestLastTurn)

  return sequence
}

function addNonBuyTurnsToSequence(sequence: Sequence): Sequence {
  const result = []
  for (let i = 1; i <= MAX_TURNS; i++) {
    const buyTurn = sequence.find(turn => turn.number === i)
    if (buyTurn) {
      console.log('found buy turn:')
      console.log(buyTurn)

      result.push(buyTurn)
    }
    else {
      const lastTurn = result[result.length - 1]
      const output = getOutput(lastTurn.finalRobots)
      const newTurn: Turn = {
        finalRobots: lastTurn.finalRobots,
        finalStock: sumMaterialAmounts(lastTurn.finalStock, output),
        number: i,
      }
      result.push(newTurn)
    }
  }
  return result
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
      let newStock: MaterialAmounts = { ...currentTurn.finalStock }
      let costsAreCovered = false

      while (!costsAreCovered) {
        turnsToWait += 1

        const isTooLate = turnsToWait + currentTurn.number > MAX_TURNS - 1
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
    // low to high
    const highestPrio = this.items.sort((a, b) => a.priority - b.priority)[0]
    const i = this.items.indexOf(highestPrio)
    this.items.splice(i, 1)
    return highestPrio.item
  }

  public empty() {
    return this.items.length === 0
  }
}
