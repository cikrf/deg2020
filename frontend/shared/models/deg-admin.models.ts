import { ELECTIONS_STATUS } from '../../projects/admin/src/app/utils/enums/elections-status.enum';

/**
 * ApiResponse«JobStartedResponse»
 */
export interface ApiResponseJobStartedResponse {
  data?: /* JobStartedResponse */ JobStartedResponse;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«List«BatchEvent»»
 */
export interface ApiResponseListBatchEvent {
  data?: /* BatchEvent */ BatchEvent[];
  error?: /* Error */ Error;
}
/**
 * ApiResponse«long»
 */
export interface ApiResponseLong {
  data?: number; // int64
  error?: /* Error */ Error;
}
/**
 * ApiResponse«StatisticsDto»
 */
export interface ApiResponseStatisticsDto {
  data?: /* StatisticsDto */ StatisticsDto;
  error?: /* Error */ Error;
}
/**
 * ApiResponse«uuid»
 */
export interface ApiResponseUuid {
  data?: string; // uuid
  error?: /* Error */ Error;
}
/**
 * BatchEvent
 */
export interface BatchEvent {
  code?: number; // int32
  description?: string;
  errors?: string[];
  eventType?: string;
  status?: string;
  uid?: string;
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
  num?: number; // int32
  voteCount?: number; // int32
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
  languageCode?: number; // int32
  mainKeyX?: string;
  mainKeyY?: string;
  name?: string;
  startDateTime?: string; // date-time
  status?: ELECTIONS_STATUS;
  token?: string;
  translated?: boolean;
  uik?: number; // int32
}
/**
 * ElectionStatusUpdateResponse
 */
export interface ElectionStatusUpdateResponse {
  faultMessage?: string;
  id?: string; // uuid
  status?:
    | 'NEW'
    | 'PREPARING'
    | 'READY'
    | 'IN_PROCESS'
    | 'COMPLETED'
    | 'RESULT_COMPLETED';
  statusChanged?: boolean;
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
 * JobStartedResponse
 */
export interface JobStartedResponse {
  code?: number; // int32
  description?: string;
  eventType?: string;
  uid?: string;
}
/**
 * SearchResponse«ElectionDto»
 */
export interface SearchResponseElectionDto {
  data?: /* ElectionDto */ ElectionDto[];
  totalCount?: number; // int64
}
/**
 * SearchResponse«SmsVerificationListDto»
 */
export interface SearchResponseSmsVerificationListDto {
  data?: /* SmsVerificationListDto */ SmsVerificationListDto[];
  totalCount?: number; // int64
}
/**
 * SearchResponse«VoterListListDto»
 */
export interface SearchResponseVoterListListDto {
  data?: /* VoterListListDto */ VoterListListDto[];
  totalCount?: number; // int64
}
/**
 * SmsVerificationListDto
 */
export interface SmsVerificationListDto {
  electionId?: string; // uuid
  electionName?: string;
  id?: string; // uuid
  phoneNumber?: string;
  sendingTime?: string; // date-time
  status?: 'SENT' | 'RECEIVED' | 'VERIFIED';
}
/**
 * StatisticsDto
 */
export interface StatisticsDto {
  ballotCount?: number; // int64
  createdAt?: string; // date-time
  id?: string; // uuid
  name?: string;
  votedCount?: number; // int64
  voterCountAll?: number; // int64
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
 * VoterListAddDto
 */
export interface VoterListAddDto {
  birthDate?: string; // date
  electionExternalId?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  numDoc?: string;
  serDoc?: string;
  uikId?: number; // int64
  userId?: string; // uuid
}
/**
 * VoterListListDto
 */
export interface VoterListListDto {
  ballotName?: string;
  ballotStatus?: 'ISSUED' | 'NOT_ISSUED';
  birthDate?: string; // date
  firstName?: string;
  id?: string; // uuid
  includeVoterIds?: boolean;
  isActive?: boolean;
  lastName?: string;
  middleName?: string;
  numDoc?: string;
  number?: number; // int32
  referendumId?: string;
  serDoc?: string;
  status?: 'ACTIVE' | 'NOT_ACTIVE' | 'VOTED_OFFLINE';
  voterFullAddress?: string;
  voterListUserIds?: string /* uuid */[];
  voterPhoneNumber?: string;
}
/**
 * VoterListStatusUpdateResponse
 */
export interface VoterListStatusUpdateResponse {
  id?: string; // uuid
  status?: 'ACTIVE' | 'NOT_ACTIVE' | 'VOTED_OFFLINE';
}
