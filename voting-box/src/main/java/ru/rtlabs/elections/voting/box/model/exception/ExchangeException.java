package ru.rtlabs.elections.voting.box.model.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import ru.rtlabs.elections.voting.box.dto.ApiResponse;

@Getter
public class ExchangeException extends RuntimeException {

    private final ApiResponse apiResponse;
    private final HttpStatus httpStatus;

    public ExchangeException(String message, Throwable throwable, ApiResponse apiResponse, HttpStatus httpStatus) {
        super(message, throwable);
        this.apiResponse = apiResponse;
        this.httpStatus = httpStatus;
    }
}
