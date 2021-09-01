package ru.rtlabs.elections.voting.box.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;

@Data
@Accessors(chain = true)
@AllArgsConstructor
public class SimpleMessageResponse implements Serializable {

    protected int code;
    protected String description;

    public static SimpleMessageResponse valueOf(ApiResponseCode apiResponseCode) {
        return new SimpleMessageResponse(apiResponseCode.getCode(), apiResponseCode.getDescription());
    }
}
