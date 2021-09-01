package ru.rtlabs.elections.voting.box.config.props;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "metric-names")
@Getter
@Setter
public class MetricNamesProperties {

    private String sendVoteRequest;
    private String voteAlreadyMadeError;
    private String voteAfterElectionCompletedError;
    private String sendVoteSuccess;
    private String blindSignCheckError;
}
