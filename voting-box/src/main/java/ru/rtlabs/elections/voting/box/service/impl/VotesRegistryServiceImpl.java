package ru.rtlabs.elections.voting.box.service.impl;

import com.google.common.base.Preconditions;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;
import ru.rtlabs.elections.voting.box.model.exception.BusinessException;
import ru.rtlabs.elections.voting.box.model.exception.VotesRegistry;
import ru.rtlabs.elections.voting.box.repository.VotesRegistryRepository;
import ru.rtlabs.elections.voting.box.service.MetricService;
import ru.rtlabs.elections.voting.box.service.VotesRegistryService;

import java.util.UUID;

@Service
@AllArgsConstructor
public class VotesRegistryServiceImpl implements VotesRegistryService {

    private final MetricService metricService;
    private final VotesRegistryRepository votesRegistryRepository;

    @Override
    public void save(String publicKey, UUID electionId) {
        votesRegistryRepository.save(new VotesRegistry(electionId, publicKey));
    }

    @Override
    public void checkVoteMade(String publicKey, UUID electionId, String electionExternalId) {
        if (voteExists(publicKey, electionId)) {
            metricService.voteAlreadyMadeErrorCounter(electionExternalId);
            throw new BusinessException(ApiResponseCode.VOTE_ALREADY_MADE);
        }
    }

    @Override
    public boolean voteExists(String publicKey, UUID electionId) {
        Preconditions.checkArgument(publicKey != null, "Public key must be provided");
        Preconditions.checkArgument(electionId != null, "Election id must be provided");
        return Boolean.TRUE.equals(votesRegistryRepository.existsByElectionIdAndPublicKey(electionId, publicKey));
    }
}
