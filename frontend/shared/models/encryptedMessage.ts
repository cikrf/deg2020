export interface EncryptedMessage {
  message: string;
  password: string;
  salt: Uint8Array;
  sign?: string;
  privateKey?: any;
  publicKey?: any;
}
