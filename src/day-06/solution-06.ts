interface Solution6 {
  answer1: number
}

export default async function solution(code: string): Promise<Solution6> {
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
    if (candidates.length === 4) break
  }

  return { answer1: count }
}
