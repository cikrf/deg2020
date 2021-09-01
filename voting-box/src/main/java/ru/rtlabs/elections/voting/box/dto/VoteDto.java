package ru.rtlabs.elections.voting.box.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class VoteDto {

    private String senderPublicKey;
    private String authorPublicKey;
    private String sender;
    private String contractId;
    private Long timestamp;
    private Integer fee = 0;
    private UUID electionId;
    private List<Param> params;
    private String signature;
    private List<String> proofs;
    private Integer type;
    private Integer version;
    private Integer contractVersion;
}
