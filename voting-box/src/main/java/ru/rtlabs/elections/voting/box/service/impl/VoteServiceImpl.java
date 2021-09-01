package ru.rtlabs.elections.voting.box.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import ru.rtlabs.elections.voting.box.config.props.KafkaProperties;
import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;
import ru.rtlabs.elections.voting.box.dto.VoteDto;
import ru.rtlabs.elections.voting.box.dto.VoteKafkaDto;
import ru.rtlabs.elections.voting.box.model.exception.BusinessException;
import ru.rtlabs.elections.voting.box.service.ElectionService;
import ru.rtlabs.elections.voting.box.service.MetricService;
import ru.rtlabs.elections.voting.box.service.VoteService;
import ru.rtlabs.elections.voting.box.service.VotesRegistryService;

import java.util.UUID;

@Service
@AllArgsConstructor
public class VoteServiceImpl implements VoteService {

    private final KafkaProperties kafkaProperties;
    private final BlindSignChecker blindSignChecker;
    private final ElectionService electionService;
    private final KafkaTemplate<String, VoteKafkaDto> kafkaTemplate;
    private final VotesRegistryService votesRegistryService;
    private final MetricService metricService;

    @Override
    public void postVote(VoteDto voteDto) {
        String senderPublicKey = voteDto.getSenderPublicKey();
        UUID electionId = voteDto.getElectionId();
        String externalId = electionService.getElection(electionId).getExternalId();
        votesRegistryService.checkVoteMade(senderPublicKey, electionId, externalId);
        if (isElectionCompleted(electionId)) {
            metricService.voteAfterElectionCompletedErrorCounter(externalId);
            throw new BusinessException(ApiResponseCode.ELECTIONS_STOPPED);
        }
        blindSignChecker.checkBlindSign(voteDto);
        VoteKafkaDto dto = new VoteKafkaDto()
                .setContractId(voteDto.getContractId())
                .setSenderPublicKey(senderPublicKey)
                .setSender(voteDto.getSender())
                .setTimestamp(voteDto.getTimestamp())
                .setParams(voteDto.getParams())
                .setProofs(voteDto.getProofs())
                .setVersion(voteDto.getVersion())
                .setContractVersion(voteDto.getContractVersion())
                .setType(voteDto.getType())
                .setFee(voteDto.getFee());

        kafkaTemplate.send(kafkaProperties.getTopicName(), dto);
        metricService.sendVoteSuccessCounter(externalId);
        votesRegistryService.save(senderPublicKey, electionId);
    }

    @Override
    public void checkCanVote(UUID electionId, String senderPublicKey) {
        if (votesRegistryService.voteExists(senderPublicKey, electionId)) {
            throw new BusinessException(ApiResponseCode.VOTE_ALREADY_MADE);
        }
        if (isElectionCompleted(electionId)) {
            throw new BusinessException(ApiResponseCode.ELECTIONS_STOPPED);
        }
    }

    private boolean isElectionCompleted(UUID electionId) {
        return electionService.getElection(electionId).getStatus().isCompleted();
    }
}
