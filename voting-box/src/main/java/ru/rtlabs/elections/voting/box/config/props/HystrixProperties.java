package ru.rtlabs.elections.voting.box.config.props;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "hystrix")
@Getter
@Setter
public class HystrixProperties {

    private String isolationStrategy;
    private int timout;
    private int requestVolumeThreshold;
    private int sleepWindowInMilliseconds;
    private int corePoolSize;
    private int maxPoolSize;
    private int maxQueueSize;
    private int queueSizeRejectionThreshold;

}
