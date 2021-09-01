package ru.rtlabs.elections.voting.box.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import ru.rtlabs.elections.voting.box.dto.ApiResponse;
import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;
import ru.rtlabs.elections.voting.box.model.exception.BusinessException;

import java.util.stream.Collectors;

@ControllerAdvice
@Slf4j
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse> handleExceptions(Exception ex) {
        String message = ex.getMessage();
        log.error(message, ex);
        HttpStatus status = ex instanceof IllegalArgumentException ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status)
                .body(ApiResponse.error(ApiResponseCode.INTERNAL_SERVER_ERROR, ex));
    }


    @ExceptionHandler(value = BusinessException.class)
    public ResponseEntity<ApiResponse> handleBusinessExceptions(BusinessException e) {
        String message = e.getMessage();
        log.error("Business exception occurred on the server. Message: {}", message);
        log.error(e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.error(e.getApiResponseCode(), e.getData(), e, e.getParams()));
    }


    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
                                                                  HttpStatus status, WebRequest request) {
        return handleValidationExceptions(ex.getBindingResult(), status, ex);
    }

    @Override
    protected ResponseEntity<Object> handleBindException(BindException ex, HttpHeaders headers, HttpStatus status, WebRequest request) {
        return handleValidationExceptions(ex.getBindingResult(), status, ex);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers, HttpStatus status, WebRequest request) {
        String message = ex.getMessage();
        log.error(message, ex);
        ApiResponseCode responseCode = ApiResponseCode.INTERNAL_SERVER_ERROR;
        switch (status) {
            case METHOD_NOT_ALLOWED:
                responseCode = ApiResponseCode.METHOD_NOT_ALLOWED;
                break;
            case UNSUPPORTED_MEDIA_TYPE:
                responseCode = ApiResponseCode.UNSUPPORTED_MEDIA_TYPE;
                break;
            case NOT_ACCEPTABLE:
                responseCode = ApiResponseCode.NOT_ACCEPTABLE;
                break;
            case BAD_REQUEST:
                responseCode = ApiResponseCode.BAD_REQUEST;
                break;
            case NOT_FOUND:
                responseCode = ApiResponseCode.NOT_FOUND;
                break;
            case SERVICE_UNAVAILABLE:
                responseCode = ApiResponseCode.SERVICE_UNAVAILABLE;
                break;
        }
        return ResponseEntity
                .status(status)
                .headers(headers)
                .body(ApiResponse.error(responseCode, ex));
    }

    private ResponseEntity<Object> handleValidationExceptions(BindingResult bindingResult, HttpStatus status, Exception ex) {
        String message = bindingResult
                .getAllErrors()
                .stream()
                .map(objectError -> {
                    if (objectError instanceof FieldError) {
                        return "[" + ((FieldError) objectError).getField() + "] " + objectError.getDefaultMessage();
                    }

                    return objectError.getDefaultMessage();
                })
                .collect(Collectors.joining("\n"));
        log.error(message, ex);
        return ResponseEntity.status(status)
                .body(ApiResponse.error(ApiResponseCode.BAD_REQUEST, message));
    }
}
