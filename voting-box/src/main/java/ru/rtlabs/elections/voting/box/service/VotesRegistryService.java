package ru.rtlabs.elections.voting.box.service;

import java.util.UUID;

public interface VotesRegistryService {

    void checkVoteMade(String publicKey, UUID electionId, String electionExternalId);

    void save(String publicKey, UUID electionId);

    boolean voteExists(String publicKey, UUID electionId);

}
