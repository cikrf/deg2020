package ru.rtlabs.elections.voting.box.model.exception;

import ru.rtlabs.elections.voting.box.dto.ApiResponseCode;

public class BusinessException extends RuntimeException {

    private final ApiResponseCode apiResponseCode;
    private final Object[] params;
    private final Object data;

    public BusinessException(ApiResponseCode apiResponseCode, Object... params) {
        super(apiResponseCode.getDescription());
        this.apiResponseCode = apiResponseCode;
        this.data = null;
        this.params = params;
    }

    public BusinessException(ApiResponseCode apiResponseCode, Object data, Object... params) {
        super(apiResponseCode.getDescription());
        this.apiResponseCode = apiResponseCode;
        this.params = params;
        this.data = data;
    }

    public BusinessException(ApiResponseCode apiResponseCode, String description, Object... params) {
        super(apiResponseCode.getDescription() + description);
        this.apiResponseCode = apiResponseCode;
        this.params = params;
        this.data = null;
    }

    public BusinessException(Throwable cause, ApiResponseCode apiResponseCode, Object... params) {
        super(apiResponseCode.getDescription(), cause);
        this.apiResponseCode = apiResponseCode;
        this.params = params;
        this.data = null;
    }

    public ApiResponseCode getApiResponseCode() {
        return apiResponseCode;
    }

    public Object[] getParams() {
        return params;
    }

    public Object getData() {
        return data;
    }
}
