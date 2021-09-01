package ru.rtlabs.elections.voting.box.controller.api;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import ru.rtlabs.elections.voting.box.dto.ApiResponse;
import ru.rtlabs.elections.voting.box.dto.VoteDto;

import java.util.UUID;

@Api(description = "API отправки голоса")
public interface VotingApi {

    @ApiOperation(value = "Отправить голос")
    ResponseEntity<ApiResponse<Void>> postVote(@RequestBody VoteDto voteDto);

    @ApiOperation(value = "Проверить запись о голосовании")
    ResponseEntity<ApiResponse<Boolean>> getVoteState(@RequestParam String senderPublicKey, @RequestParam UUID electionId);
}
