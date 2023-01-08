import type { Solution19, Material, Cost, Robot, Blueprint } from './types'

export default async function solution(input: string): Promise<Solution19> {
  const bps = parseBlueprints(input)
  console.log(bps)
  console.log(bps[0].robots.ore)
  console.log(bps[0].robots.geode)

  return { answer1: 0 }
}

function parseBlueprints(input: string): Blueprint[] {
  return input.split('\n').map(line => {
    const [name, robotInfos] = line.split(': ')
    const robots: Record<Material, Robot> = robotInfos
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
        const robot: Robot = { material: targetMaterial, costs }
        return {
          ...result,
          [targetMaterial]: robot,
        }
      }, {} as Record<Material, Robot>)
    const bp: Blueprint = {
      name,
      robots,
    }
    return bp
  })
}
