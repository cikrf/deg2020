package ru.rtlabs.elections.voting.box.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;
import ru.rtlabs.elections.voting.box.dto.BlindSignVerificationDto;
import ru.rtlabs.elections.voting.box.dto.BlindSignVerificationResponseDto;
import ru.rtlabs.elections.voting.box.dto.VoteDto;
import ru.rtlabs.elections.voting.box.model.exception.BusinessException;
import ru.rtlabs.elections.voting.box.service.ElectionService;
import ru.rtlabs.elections.voting.box.service.MetricService;
import ru.rtlabs.elections.voting.box.service.rest.CryptoServiceClient;

import java.util.UUID;

@Component
@AllArgsConstructor
class BlindSignChecker {

    private final ElectionService electionService;
    private final CryptoServiceClient cryptoServiceClient;
    private final MetricService metricService;

    void checkBlindSign(VoteDto voteDto) {
        UUID electionId = voteDto.getElectionId();
        final String externalId = electionService.getElection(electionId).getExternalId();
        try {
            BlindSignVerificationResponseDto response = cryptoServiceClient.verifyBlindSign(
                    BlindSignVerificationDto.builder()
                            .electionId(electionId).message(voteDto.getSenderPublicKey()).signature(voteDto.getSignature()).build())
                    .getData();
            if (!response.isVerified()) {
                throw new BusinessException(ApiResponseCode.BLIND_SIGN_VERIFICATION_ERROR);
            }
        } catch (BusinessException e) {
            metricService.blindSignCheckErrorCounter(externalId);
            throw e;
        } catch (Exception e) {
            metricService.blindSignCheckErrorCounter(externalId);
            throw new BusinessException(e, ApiResponseCode.BLIND_SIGN_VERIFICATION_ERROR);
        }
    }

}
