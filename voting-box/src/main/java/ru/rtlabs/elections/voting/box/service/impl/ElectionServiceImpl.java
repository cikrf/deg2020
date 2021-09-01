package ru.rtlabs.elections.voting.box.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import ru.rtlabs.elections.voting.box.dto.ElectionDto;
import ru.rtlabs.elections.voting.box.service.ElectionService;
import ru.rtlabs.elections.voting.box.service.rest.VotingServiceClient;

import java.util.UUID;

@Service
@AllArgsConstructor
public class ElectionServiceImpl implements ElectionService {

    private final VotingServiceClient votingServiceClient;

    @Override
    @Cacheable(key = "'election_id'.concat(#electionId)", cacheNames = "election-simple-model-cache")
    public ElectionDto getElection(UUID electionId) {
        return votingServiceClient.getElectionSimpleModel(electionId).getData();
    }
}
