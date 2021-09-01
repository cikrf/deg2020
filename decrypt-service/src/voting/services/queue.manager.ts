export class QueueManager<T> {
  private readonly votings: T[] = []
  private readonly updater: (_1: T[], _2: T[]) => T[]
  private queue: T[] = []

  constructor(votings: T[], updater: (_1: T[], _2: T[]) => T[]) {
    this.votings = votings
    this.updater = updater
  }

  get(n: number = 1): T[] {
    if (this.queue.length === 0) {
      this.queue = this.updater(this.queue, this.votings)
    }
    return this.queue.splice(0, n)
  }
}
