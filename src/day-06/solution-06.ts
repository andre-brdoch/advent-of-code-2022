import { Solution6 } from './types'

export default async function solution(code: string): Promise<Solution6> {
  return {
    answer1: countTillMarker(code, 4),
    answer2: countTillMarker(code, 14),
  }
}

function countTillMarker(code: string, markerLength: number): number {
  let candidates: string[] = []
  let count = 1
  const chars = code.split('')

  for (; count < chars.length + 1; count += 1) {
    const char = chars[count - 1]
    const i = candidates.indexOf(char)
    // if already candidate
    if (i !== -1) candidates = candidates.slice(i + 1)
    candidates.push(char)
    // if done
    if (candidates.length === markerLength) break
  }
  // if not solved
  if (candidates.length < markerLength || count < markerLength) return -1

  return count
}
