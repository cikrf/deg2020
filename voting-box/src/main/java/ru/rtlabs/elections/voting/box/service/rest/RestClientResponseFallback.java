package ru.rtlabs.elections.voting.box.service.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import feign.hystrix.FallbackFactory;
import org.springframework.http.HttpStatus;
import ru.rtlabs.elections.voting.box.dto.ApiResponse;
import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;
import ru.rtlabs.elections.voting.box.model.exception.ExchangeException;

import java.util.Optional;

public abstract class RestClientResponseFallback<T> implements FallbackFactory<T> {

    private final ObjectMapper objectMapper;

    protected RestClientResponseFallback(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public T create(Throwable throwable) {
        if (throwable instanceof FeignException) {
            final byte[] content = ((FeignException) throwable).content();
            final HttpStatus status = HttpStatus.valueOf(((FeignException) throwable).status());
            throw new ExchangeException(throwable.getMessage(), throwable, getApiResponse(content), status);
        }
        throw new ExchangeException(throwable.getMessage(), throwable, ApiResponse.error(getDefaultResponseCode(), throwable), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    protected abstract ApiResponseCode getDefaultResponseCode();

    private ApiResponse getApiResponse(byte[] content) {
        return Optional.ofNullable(content).map(con -> {
            try {
                return objectMapper.readValue(content, ApiResponse.class);
            } catch (Exception e) {
                return ApiResponse.error(getDefaultResponseCode(), new String(content));
            }
        }).orElse(ApiResponse.error(getDefaultResponseCode()));
    }
}
