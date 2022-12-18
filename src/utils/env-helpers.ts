export function isTest(): boolean {
  const [, , , mode] = process.argv
  return mode === 'test'
}
