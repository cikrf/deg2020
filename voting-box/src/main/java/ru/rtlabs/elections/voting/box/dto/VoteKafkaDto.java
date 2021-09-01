package ru.rtlabs.elections.voting.box.dto;

import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class VoteKafkaDto {

    private String senderPublicKey;
    private String sender;
    private String contractId;
    private Long timestamp;
    private Integer fee;
    private List<Param> params;
    private List<String> proofs;
    private Integer type;
    private Integer version;
    private Integer contractVersion;
}
