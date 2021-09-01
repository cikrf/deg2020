package ru.rtlabs.elections.voting.box.service.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import ru.rtlabs.elections.voting.box.dto.ApiResponse;
import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;
import ru.rtlabs.elections.voting.box.dto.BlindSignVerificationDto;
import ru.rtlabs.elections.voting.box.dto.BlindSignVerificationResponseDto;

@FeignClient(value = RestClient.CRYPTO_SERVICE, fallbackFactory = CryptoServiceClient.Fallback.class, configuration = FeignConfiguration.class)
public interface CryptoServiceClient {

    @RequestMapping(method = RequestMethod.POST, value = "/api/internal/blind-sign/verification")
    ApiResponse<BlindSignVerificationResponseDto> verifyBlindSign(BlindSignVerificationDto dto);

    @Component
    class Fallback extends RestClientResponseFallback<CryptoServiceClient> {

        protected Fallback(ObjectMapper objectMapper) {
            super(objectMapper);
        }

        @Override
        protected ApiResponseCode getDefaultResponseCode() {
            return ApiResponseCode.CRYPTO_SERVICE_EXCHANGE_ERROR;
        }
    }

}
