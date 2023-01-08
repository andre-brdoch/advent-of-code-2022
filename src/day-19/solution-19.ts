import { Logger } from '../utils/Logger.js'
import {
  Solution19,
  Material,
  Cost,
  Robot,
  RobotBlueprint,
  Blueprint,
  OutputByMinute,
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

  logger.log('\n')
  return { answer1: 0 }
}

function getOutput(robots: Robot[], turns = 1): OutputByMinute {
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

function createRobot(material: Material): Robot {
  return { material }
}

function parseBlueprints(input: string): Blueprint[] {
  return input.split('\n').map(line => {
    const [name, robotInfos] = line.split(': ')
    const robots: Record<Material, RobotBlueprint> = robotInfos
      // 'Blueprint 1: Each ore robot costs 4 ore. Each obsidian robot costs 3 ore and 14 clay.'
      .split('. ')
      // "Each obsidian robot costs 3 ore and 14 clay"
      .reduce((result, robotInfo) => {
        const [intro, costsString] = robotInfo.split(' costs ')
        // "Each ore robot" -> "ore"
        const targetMaterial = intro
          .replace(/^Each /, '')
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
