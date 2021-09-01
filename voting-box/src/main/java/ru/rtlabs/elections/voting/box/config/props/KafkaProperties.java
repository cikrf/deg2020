package ru.rtlabs.elections.voting.box.config.props;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kafka")
@Getter
@Setter
public class KafkaProperties {

    private String bootstrapAddress;
    private String topicName;
}
