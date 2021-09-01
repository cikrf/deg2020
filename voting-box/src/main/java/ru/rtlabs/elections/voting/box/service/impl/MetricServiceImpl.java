package ru.rtlabs.elections.voting.box.service.impl;

import io.micrometer.core.instrument.ImmutableTag;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import org.springframework.stereotype.Service;
import ru.rtlabs.elections.voting.box.config.props.MetricNamesProperties;
import ru.rtlabs.elections.voting.box.config.props.MetricProperties;
import ru.rtlabs.elections.voting.box.service.MetricService;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;

@Service
class MetricServiceImpl implements MetricService {

    private static final String SERVICE_NAME_TAG = "serviceName";
    private static final String INSTANCE_ID_TAG = "instanceId";
    private static final String ELECTION_ID_TAG = "electionId";

    private final MeterRegistry meterRegistry;
    private final MetricNamesProperties metricNamesProperties;
    private final MetricProperties metricProperties;

    private List<Tag> tags;

    MetricServiceImpl(MeterRegistry meterRegistry,
                      MetricNamesProperties metricNamesProperties,
                      MetricProperties metricProperties) {
        this.meterRegistry = meterRegistry;
        this.metricNamesProperties = metricNamesProperties;
        this.metricProperties = metricProperties;
    }

    @PostConstruct
    public void init() {
        tags = new ArrayList<>(2);
        tags.add(new ImmutableTag(SERVICE_NAME_TAG, metricProperties.getApplicationName()));
        tags.add(new ImmutableTag(INSTANCE_ID_TAG, metricProperties.getInstanceId()));
    }


    @Override
    public void sendVoteRequestCounter(String electionExternalId) {
        counter(metricNamesProperties.getSendVoteRequest(), electionExternalId);
    }

    @Override
    public void voteAlreadyMadeErrorCounter(String electionExternalId) {
        counter(metricNamesProperties.getVoteAlreadyMadeError(), electionExternalId);
    }

    @Override
    public void voteAfterElectionCompletedErrorCounter(String electionExternalId) {
        counter(metricNamesProperties.getVoteAfterElectionCompletedError(), electionExternalId);
    }

    @Override
    public void sendVoteSuccessCounter(String electionExternalId) {
        counter(metricNamesProperties.getSendVoteSuccess(), electionExternalId);
    }

    @Override
    public void blindSignCheckErrorCounter(String electionExternalId) {
        counter(metricNamesProperties.getBlindSignCheckError(), electionExternalId);
    }

    private void counter(String metricName, String electionExternalId) {
        ArrayList<Tag> allTags = new ArrayList<>(this.tags);
        allTags.add(new ImmutableTag(ELECTION_ID_TAG, electionExternalId));
        meterRegistry.counter(metricName, allTags).increment();
    }
}
