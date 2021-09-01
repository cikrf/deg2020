package ru.rtlabs.elections.voting.box.config.props;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class MetricProperties {

    @Value("${spring.application.name}")
    private String applicationName;
    @Value("${eureka.instance.instance-id}")
    private String instanceId;

}
