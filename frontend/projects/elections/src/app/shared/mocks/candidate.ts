import { CandidateDto, IncorrectData } from '@shared/models/portal.models';

export class Candidate implements CandidateDto {
  name: string;
  status: string;
  party: string;
  pic: string;
  birthday: string;
  birthplace: string;
  reside: string;
  education: string;
  work: string;
  post: string;
  income: string;
  realEstate: string;
  auto: string;
  money: string;
  maritalStatus: string;
  other: string;
  location: number;
  number: number;
  description?: string;
  externalId?: string;
  fio?: string;
  id?: string; // uuid
  isVote?: boolean;
  isHardcoded?: boolean;
  incorrect?: IncorrectData;
}
