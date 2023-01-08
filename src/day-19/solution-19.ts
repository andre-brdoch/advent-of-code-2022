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
} from './types'

const logger = new Logger()

const START_ROBOTS = [createRobot('ore')]
const MAX_TURNS = 24

export default async function solution(input: string): Promise<Solution19> {
  const bps = parseBlueprints(input)
  console.log(bps[0].robots.ore)
  console.log(bps[0].robots.geode)
  const robots = [...START_ROBOTS]
  const output = getOutput(robots)
  logger.log('\nOutput:')
  logger.log(output)
  logger.log('\nOutput in 3 turns:')
  logger.log(getOutput(robots, 3))

  const turn: Turn = {
    number: 2,
    finalRobots: [createRobot('ore'), createRobot('clay')],
    buy: bps[0].robots.clay,
    finalStock: {
      ore: 3,
      clay: 3,
      obsidian: 0,
      geode: 0,
    },
  }
  logger.log(stringifyTurn(turn))

  logger.log('\n')
  return { answer1: 0 }
}

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

        if (turnsToWait + currentTurn.number > MAX_TURNS) {
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
        if (costsAreCovered) break
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

function countRobotsByMaterial(robots: Robot[], material: Material): number {
  return robots.filter(robot => robot.material === material).length
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
