import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto'

const CIPHER_ALGORITHM = 'aes-256-ctr'
const START_STR = 'checksum'

export const encryptAes256 = (text: string, salt: string) => {
  const sha256 = createHash('sha256')
  sha256.update(salt)

  const iv = randomBytes(16)
  const cipher = createCipheriv(CIPHER_ALGORITHM, sha256.digest(), iv)

  const ciphertext = cipher.update(Buffer.from(START_STR + text))
  return Buffer.concat([iv, ciphertext, cipher.final()]).toString('base64')
}

export const decryptAes256 = (encrypted: string, salt: string) => {
  const sha256 = createHash('sha256')
  sha256.update(salt)

  const input = Buffer.from(encrypted, 'base64')

  if (input.length < 17) {
    throw new TypeError('Provided "encrypted" must decrypt to a non-empty string')
  }

  const iv = input.slice(0, 16)
  const decipher = createDecipheriv(CIPHER_ALGORITHM, sha256.digest(), iv)

  const ciphertext = input.slice(16)
  const str = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString()
  if (str.substr(0, START_STR.length) !== START_STR) {
    throw new Error('Aes256 decryption failed')
  }

  return str.substr(START_STR.length)
}
