import { parseArgs } from './env-helpers.js'

export class Logger {
  private disabled: boolean
  private fullLog: string
  private outputName: string

  constructor({ outputName = 'output.txt' } = {}) {
    const { noLog } = parseArgs()
    this.disabled = !!noLog
    this.fullLog = ''
    this.outputName = outputName
  }

  public log(...inputs: unknown[]): void {
    if (!this.disabled) {
      console.log(...inputs)
    }

    if (this.fullLog.length) this.fullLog += '\n'
    this.fullLog += inputs
      .map(input => {
        if (typeof input === 'string') return input
        else return input?.toString?.() ?? ''
      })
      .join(' ')
  }

  public getFullLog(): string {
    return this.fullLog
  }

  public getVisual(fileName?: string): {
    file: string
    data: string
  } | null {
    const { visualize } = parseArgs()
    return visualize
      ? {
        file: fileName || this.outputName,
        data: this.fullLog,
      }
      : null
  }
}
