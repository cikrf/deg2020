/**
 * ApiResponse«BallotIssuingResponseDto»
 */
export interface ApiResponseBallotIssuingResponseDto {
  data?: /* BallotIssuingResponseDto */ BallotIssuingResponseDto;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«BlindSignKeysDto»
 */
export interface ApiResponseBlindSignKeysDto {
  data?: /* BlindSignKeysDto */ BlindSignKeysDto;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«boolean»
 */
export interface ApiResponseBoolean {
  data?: boolean;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«EbsExtendedAuthResultResponse»
 */
export interface ApiResponseEbsExtendedAuthResultResponse {
  data?: /* EbsExtendedAuthResultResponse */ EbsExtendedAuthResultResponse;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«EbsVerificationUrlResponse»
 */
export interface ApiResponseEbsVerificationUrlResponse {
  data?: /* EbsVerificationUrlResponse */ EbsVerificationUrlResponse;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«ElectionDto»
 */
export interface ApiResponseElectionDto {
  data?: /* ElectionDto */ ElectionDto;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«EsiaAccessTokenResponse»
 */
export interface ApiResponseEsiaAccessTokenResponse {
  data?: /* EsiaAccessTokenResponse */ EsiaAccessTokenResponse;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«EsiaAuthCodeUrlResponse»
 */
export interface ApiResponseEsiaAuthCodeUrlResponse {
  data?: /* EsiaAuthCodeUrlResponse */ EsiaAuthCodeUrlResponse;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«List«NationalLanguageDto»»
 */
export interface ApiResponseListNationalLanguageDto {
  data?: /* NationalLanguageDto */ NationalLanguageDto[];
  error?: /* Error */ Error;
}
/**
 * ApiResponse«List«string»»
 */
export interface ApiResponseListString {
  data?: string[];
  error?: /* Error */ Error;
}
/**
 * ApiResponse«SmsVerificationResponseDto»
 */
export interface ApiResponseSmsVerificationResponseDto {
  data?: /* SmsVerificationResponseDto */ SmsVerificationResponseDto;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«UserSettingsDto»
 */
export interface ApiResponseUserSettingsDto {
  data?: /* UserSettingsDto */ UserSettingsDto;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«Void»
 */
export interface ApiResponseVoid {
  error?: /* Error */ Error;
}
/**
 * BallotIssuingResponseDto
 */
export interface BallotIssuingResponseDto {
  blindSign?: /* BlindSignDto */ BlindSignDto;
  contractId?: string;
  id?: string; // uuid
  languageCode?: number; // int32
  mainKey?: /* MainKeyDto */ MainKeyDto;
}
/**
 * BioMatchingData
 */
export interface BioMatchingData {
  face?: string;
  overall?: string;
  voice?: string;
}
/**
 * BlindSignDto
 */
export interface BlindSignDto {
  c?: string;
  d?: string;
  r?: string;
  s?: string;
}
/**
 * BlindSignKeysDto
 */
export interface BlindSignKeysDto {
  ax?: string;
  ay?: string;
  bx?: string;
  by?: string;
  publicXCoord?: string;
  publicYCoord?: string;
  zx?: string;
  zy?: string;
}
/**
 * ByteArrayResource
 */
export interface ByteArrayResource {
  byteArray?: string; // byte
  description?: string;
  file?: /* File */ File;
  filename?: string;
  inputStream?: /* InputStream */ InputStream;
  open?: boolean;
  readable?: boolean;
  uri?: /* URI */ URI;
  url?: /* URL */ URL;
}
/**
 * CandidateDto
 */
export interface CandidateDto {
  description?: string;
  externalId?: string;
  fio?: string;
  id?: string; // uuid
  isVote?: boolean;
  number: number;
}

/**
 * Candidate incorrect data
 */
export interface IncorrectData {
  money: string;
}
/**
 * Document
 */
export interface Document {
  etag?: string;
  id?: number; // int64
  issueDate?: string;
  issueId?: string;
  issuedBy?: string;
  number?: string;
  series?: string;
  type?: string;
  vrfStu?: string;
}
/**
 * Documents
 */
export interface Documents {
  elements?: /* Document */ Document[];
  etag?: string;
  size?: number; // int64
}
/**
 * EbsExtendedAuthResultResponse
 */
export interface EbsExtendedAuthResultResponse {
  extended_result?: string;
}
/**
 * EbsVerificationUrlResponse
 */
export interface EbsVerificationUrlResponse {
  verificationUrl?: string;
}
/**
 * ElectionDto
 */
export interface ElectionDto {
  ballotAlreadyIssued?: boolean;
  ballotName?: string;
  ballotRules?: string;
  candidates?: /* CandidateDto */ CandidateDto[];
  contractId?: string;
  endDateTime?: string; // date-time
  externalId?: string;
  id?: string; // uuid
  mainKeyX?: string;
  mainKeyY?: string;
  name?: string;
  startDateTime?: string; // date-time
  number?: number;
  districtName?: string; // название избирательного округа
  status?:
    | 'NEW'
    | 'PREPARING'
    | 'READY'
    | 'IN_PROCESS'
    | 'COMPLETED'
    | 'RESULT_COMPLETED';
  translated?: boolean;
  uik?: number; // int32
}
/**
 * ElectionsApiResponse
 */
export interface ElectionsApiResponse {
  data?: /* ElectionDto */ ElectionDto[];
  error?: /* Error */ Error;
  hasBiometry?: boolean;
  is18YearOld?: boolean;
}
/**
 * Error
 */
export interface Error {
  code?: number; // int32
  description?: string;
  serverMessage?: string;
}
/**
 * EsiaAccessTokenResponse
 */
export interface EsiaAccessTokenResponse {
  access_token?: string;
  expires_in?: number; // int64
  refresh_token?: string;
  state?: string;
  token_type?: string;
}
/**
 * EsiaAuthCodeUrlResponse
 */
export interface EsiaAuthCodeUrlResponse {
  url?: string;
}
/**
 * EsiaAuthenticationDto
 */
export interface EsiaAuthenticationDto {
  code?: string;
  redirectUrl?: string;
  state?: string;
}
/**
 * EsiaPerson
 */
export interface EsiaPerson {
  avatarUuid?: string;
  biomStu?: boolean;
  birthDate?: string;
  birthPlace?: string;
  citizenship?: string;
  containsUpCfmCode?: boolean;
  documents?: /* Documents */ Documents;
  etag?: string;
  firstName?: string;
  gender?: string;
  inn?: string;
  lastName?: string;
  match?: /* BioMatchingData */ BioMatchingData;
  middleName?: string;
  regCtxCfmSte?: string;
  regType?: string;
  ridDoc?: number; // int64
  snils?: string;
  social?: number; // int64
  status?: string;
  trusted?: boolean;
  updatedOn?: number; // int64
  verifying?: boolean;
}
/**
 * File
 */
export interface File {
  absolute?: boolean;
  absoluteFile?: /* File */ File;
  absolutePath?: string;
  canonicalFile?: /* File */ File;
  canonicalPath?: string;
  directory?: boolean;
  file?: boolean;
  freeSpace?: number; // int64
  hidden?: boolean;
  name?: string;
  parent?: string;
  parentFile?: /* File */ File;
  path?: string;
  totalSpace?: number; // int64
  usableSpace?: number; // int64
}
/**
 * InputStream
 */
export interface InputStream {}
/**
 * MainKeyDto
 */
export interface MainKeyDto {
  x?: string;
  y?: string;
}
/**
 * NationalLanguageDto
 */
export interface NationalLanguageDto {
  code?: number; // int32
  description?: string;
}
/**
 * SmsVerificationRequest
 */
export interface SmsVerificationRequest {
  code?: string;
  electionId?: string; // uuid
}
/**
 * SmsVerificationResponseDto
 */
export interface SmsVerificationResponseDto {
  phoneNumber?: string;
  repeatTime?: string; // date-time
  status?: 'SENT' | 'RECEIVED' | 'VERIFIED';
  verificationTime?: string; // date-time
}
/**
 * URI
 */
export interface URI {
  absolute?: boolean;
  authority?: string;
  fragment?: string;
  host?: string;
  opaque?: boolean;
  path?: string;
  port?: number; // int32
  query?: string;
  rawAuthority?: string;
  rawFragment?: string;
  rawPath?: string;
  rawQuery?: string;
  rawSchemeSpecificPart?: string;
  rawUserInfo?: string;
  scheme?: string;
  schemeSpecificPart?: string;
  userInfo?: string;
}
/**
 * URL
 */
export interface URL {
  authority?: string;
  content?: unknown;
  defaultPort?: number; // int32
  file?: string;
  host?: string;
  path?: string;
  port?: number; // int32
  protocol?: string;
  query?: string;
  ref?: string;
  userInfo?: string;
}
/**
 * UserSettingsDto
 */
export interface UserSettingsDto {
  id?: string; // uuid
  settings?: /* UserSettingsJson */ UserSettingsJson;
  userId?: number; // int64
}
/**
 * UserSettingsJson
 */
export interface UserSettingsJson {
  language?: /* NationalLanguageDto */ NationalLanguageDto;
}
