/**
 * ApiResponse«List«ElectionDto»»
 */
export interface ApiResponseListElectionDto {
  data?: /* ElectionDto */ ElectionDto[];
  error?: /* Error */ Error;
}
/**
 * ApiResponse«VoterListStatusUpdateResponse»
 */
export interface ApiResponseVoterListStatusUpdateResponse {
  data?: /* VoterListStatusUpdateResponse */ VoterListStatusUpdateResponse;
  error?: /* Error */ Error;
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
}
/**
 * ElectionDto
 */
export interface ElectionDto {
  ballotName?: string;
  candidates?: /* CandidateDto */ CandidateDto[];
  contractId?: string;
  endDateTime?: string; // date-time
  externalId?: string;
  id?: string; // uuid
  languageCode?: number; // int32
  name?: string;
  startDateTime?: string; // date-time
  status?:
    | 'PREPARING'
    | 'READY'
    | 'IN_PROCESS'
    | 'COMPLETED'
    | 'RESULT_COMPLETED';
  translated?: boolean;
  uik?: number; // int32
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
 * HistoryListDto
 */
export interface HistoryListDto {
  committeeId?: number; // int64
  eventType?: 'SELECT' | 'BLOCK';
  id?: string; // uuid
  uikId?: string; // uuid
  uikName?: string;
  userId?: string; // uuid
  userName?: string;
}
/**
 * SearchResponse«HistoryListDto»
 */
export interface SearchResponseHistoryListDto {
  data?: /* HistoryListDto */ HistoryListDto[];
}
/**
 * VoterListStatusUpdateResponse
 */
export interface VoterListStatusUpdateResponse {
  id?: string; // uuid
  status?: 'ACTIVE' | 'BLOCKED' | 'VOTED_OFFLINE';
}
