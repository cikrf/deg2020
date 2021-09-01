package ru.rtlabs.elections.voting.box.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Accessors(chain = true)
@SuperBuilder
@NoArgsConstructor
public class ElectionDto implements Serializable {

    private static final long serialVersionUID = -6893874119135316657L;

    protected UUID id;
    protected String token;
    protected String externalId;
    protected String contractId;
    protected String name;
    protected String ballotName;
    protected ElectionStatus status;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    protected LocalDateTime startDateTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    protected LocalDateTime endDateTime;
    private String districtName;
}
