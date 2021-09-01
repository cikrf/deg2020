package ru.rtlabs.elections.voting.box.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.rtlabs.elections.voting.box.controller.api.VotingApi;
import ru.rtlabs.elections.voting.box.dto.ApiResponse;
import ru.rtlabs.elections.voting.box.dto.VoteDto;
import ru.rtlabs.elections.voting.box.service.ElectionService;
import ru.rtlabs.elections.voting.box.service.MetricService;
import ru.rtlabs.elections.voting.box.service.VoteService;

import java.util.UUID;

@RestController
@RequestMapping("/vote")
@AllArgsConstructor
public class VoteController implements VotingApi {

    private final VoteService voteService;
    private final MetricService metricService;
    private final ElectionService electionService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> postVote(@RequestBody VoteDto voteDto) {
        metricService.sendVoteRequestCounter(electionService.getElection(voteDto.getElectionId()).getExternalId());
        voteService.postVote(voteDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/time")
    public ResponseEntity<ApiResponse<Long>> getTime() {
        return ResponseEntity.ok(ApiResponse.success(System.currentTimeMillis()));
    }

    @GetMapping("/can-vote")
    public ResponseEntity<ApiResponse<Boolean>> getVoteState(@RequestParam String senderPublicKey, @RequestParam UUID electionId) {
        voteService.checkCanVote(electionId, senderPublicKey);
        return ResponseEntity.ok(ApiResponse.success(true));
    }
}
