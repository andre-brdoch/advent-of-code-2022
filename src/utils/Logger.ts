import { parseArgs } from './env-helpers.js'

export class Logger {
  private disabled: boolean
  private entries: unknown[]
  private outputName: string

  constructor({ outputName = 'output.txt' } = {}) {
    const { noLog } = parseArgs()
    this.disabled = !!noLog
    this.entries = []
    this.outputName = outputName
  }

  public log(...inputs: unknown[]): void {
    if (!this.disabled) {
      console.log(...inputs)
    }

    // if (this.fullLog.length) this.fullLog += '\n'
    const entry = inputs
      .map(input => {
        if (typeof input === 'string') return input
        else return input?.toString?.() ?? ''
      })
      .join(' ')
    this.entries.push(entry)
  }

  public getFullLog(): string {
    return this.entries.join('\n')
  }

  public async animate(): Promise<void> {
    for (const entry of this.entries) {
      // wait
      await new Promise<void>(resolve => setTimeout(() => resolve(), 300))
      console.log(entry)
    }
  }

  public getVisual(fileName?: string): {
    file: string
    data: string
  } | null {
    const { visualize } = parseArgs()
    return visualize
      ? {
        file: fileName || this.outputName,
        data: this.getFullLog(),
      }
      : null
  }
}
