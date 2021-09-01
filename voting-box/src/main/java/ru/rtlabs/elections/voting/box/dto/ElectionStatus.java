package ru.rtlabs.elections.voting.box.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;

@Getter
public enum ElectionStatus {

    NEW,
    BLOCKCHAIN_ELECTION_CREATE,
    VOTER_LIST_EXPORT,
    PREPARING,
    READY,
    IN_PROCESS,
    BALLOT_ISSUING_COMPLETED,
    COMPLETED,
    COMMISSION_PRIVATE_KEY_UPLOAD,
    RESULT_CALCULATION_IN_PROCESS,
    RESULT_COMPLETED;

    @JsonIgnore
    public boolean isCompleted() {
        return this == COMPLETED || this == COMMISSION_PRIVATE_KEY_UPLOAD || this == RESULT_COMPLETED || this == RESULT_CALCULATION_IN_PROCESS;
    }
}
