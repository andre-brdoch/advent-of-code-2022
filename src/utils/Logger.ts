import { parseArgs } from './env-helpers.js'

export class Logger {
  private disabled: boolean
  private fullLog: string

  constructor() {
    const { noLog } = parseArgs()
    this.disabled = !!noLog
    this.fullLog = ''
  }

  public log(...inputs: unknown[]): void {
    if (this.disabled) return
    console.log(...inputs)

    if (this.fullLog.length) this.fullLog += '\n'
    this.fullLog += inputs
      .map(input => {
        if (typeof input === 'string') return input
        else return input?.toString?.()
      })
      .join(' ')
  }

  public getFullLog(): string {
    return this.fullLog
  }

  public getVisual(fileName: string):
    | {
        visualFile: string
        visualData: string
      }
    | Record<string, never> {
    const { visualize } = parseArgs()
    return visualize
      ? {
        visualFile: fileName,
        visualData: this.fullLog,
      }
      : {}
  }
}
