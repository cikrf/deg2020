import { EncryptedBulletin, PartiallyDecrypted } from '../crypto/interfaces'

export type VotingInfo = {
  pollId: string
  contractId: string
  dateStart: Date
  dateEnd?: Date
  k: number
  dimension: number[]
  blindSigExponent?: string,
  blindSigModulo?: string,
  admins?: string[]
  participants?: string[]
}

type BlindSig = {
  rho: string
  omega: string
  sigma: string
  delta: string
}

export type Vote = {
  id: string
  ts: Date
  height: number
  sender_public_key: string
  vote: EncryptedBulletin[]
  blindSig?: BlindSig
  mul: number
  processed: number
}

export type Decryption = {
  id: string
  ts: Date
  sender_public_key: string
  value: PartiallyDecrypted[]
}

export type Transaction = {
  id: string
  height: number
  sender_public_key: string
}

export type TransactionParam = {
  key: string
  value: string
}
