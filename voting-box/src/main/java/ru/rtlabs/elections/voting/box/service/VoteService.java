package ru.rtlabs.elections.voting.box.service;

import ru.rtlabs.elections.voting.box.dto.VoteDto;

import java.util.UUID;

public interface VoteService {

    void postVote(VoteDto voteDto);

    void checkCanVote(UUID electionId, String senderPublicKey);
}
