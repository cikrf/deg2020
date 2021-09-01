package ru.rtlabs.elections.voting.box.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.rtlabs.elections.voting.box.model.exception.VotesRegistry;

import java.util.UUID;

public interface VotesRegistryRepository extends BaseRepository<VotesRegistry> {

    @Query(value = "select true where exists(select id from votes_registry where election_id = :electionId and public_Key = :publicKey)", nativeQuery = true)
    Boolean existsByElectionIdAndPublicKey(@Param("electionId") UUID electionId, @Param("publicKey") String publicKey);

}