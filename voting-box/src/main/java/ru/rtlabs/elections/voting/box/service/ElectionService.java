package ru.rtlabs.elections.voting.box.service;

import ru.rtlabs.elections.voting.box.dto.ElectionDto;

import java.util.UUID;

public interface ElectionService {

    ElectionDto getElection(UUID electionId);
}
