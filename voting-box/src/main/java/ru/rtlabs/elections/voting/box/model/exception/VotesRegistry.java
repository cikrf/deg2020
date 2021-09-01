package ru.rtlabs.elections.voting.box.model.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Data
@Accessors(chain = true)
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name="VOTES_REGISTRY")
@Immutable
public class VotesRegistry extends OnlyInsertEntity{

    @Column(name = "ELECTION_ID", updatable = false)
    @Type(type = "pg-uuid")
    private UUID electionId;

    @Column(name = "PUBLIC_KEY", updatable = false)
    private String publicKey;
}
