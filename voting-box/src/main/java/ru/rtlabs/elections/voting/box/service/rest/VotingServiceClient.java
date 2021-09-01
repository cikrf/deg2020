package ru.rtlabs.elections.voting.box.service.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import ru.rtlabs.elections.voting.box.dto.ApiResponse;
import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;
import ru.rtlabs.elections.voting.box.dto.ElectionDto;

import java.util.UUID;

@FeignClient(value = RestClient.VOTING_SERVICE, fallbackFactory = VotingServiceClient.Fallback.class, configuration = FeignConfiguration.class)
public interface VotingServiceClient {

    @RequestMapping(method = RequestMethod.GET, value = "/api/internal/elections/{electionId}/model/simple")
    ApiResponse<ElectionDto> getElectionSimpleModel(@PathVariable(name = "electionId") UUID electionId);

    @Component
    class Fallback extends RestClientResponseFallback<VotingServiceClient> {

        protected Fallback(ObjectMapper objectMapper) {
            super(objectMapper);
        }

        @Override
        protected ApiResponseCode getDefaultResponseCode() {
            return ApiResponseCode.VOTING_SERVICE_EXCHANGE_ERROR;
        }
    }

}
