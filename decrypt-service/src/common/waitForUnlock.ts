import { Decryption } from '../entities/decryption.entity'
import { Main } from '../entities/main.entity'
import { sleep } from './sleep'

export const waitForUnlock = async (voting: Decryption | Main): Promise<void> => {
  // tslint:disable-next-line:no-empty
  while (voting.lock) { await sleep(100) }
  return
}
