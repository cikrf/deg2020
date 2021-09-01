package ru.rtlabs.elections.voting.box.service;

public interface MetricService {

    void sendVoteRequestCounter(String electionExternalId);

    void voteAlreadyMadeErrorCounter(String electionExternalId);

    void voteAfterElectionCompletedErrorCounter(String electionExternalId);

    void sendVoteSuccessCounter(String electionExternalId);

    void blindSignCheckErrorCounter(String electionExternalId);
}
