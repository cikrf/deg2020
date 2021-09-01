package ru.rtlabs.elections.voting.box.config;

import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandGroupKey;
import com.netflix.hystrix.HystrixCommandKey;
import com.netflix.hystrix.HystrixCommandProperties;
import com.netflix.hystrix.HystrixThreadPoolProperties;
import feign.Feign;
import feign.hystrix.HystrixFeign;
import feign.hystrix.SetterFactory;
import lombok.AllArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ru.rtlabs.elections.voting.box.config.props.HystrixProperties;

@Configuration
@AllArgsConstructor
public class HystrixSetterConfiguration {

    private final HystrixProperties hystrixProperties;

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "feign.hystrix.enabled")
    public Feign.Builder feignHystrixBuilder() {
        SetterFactory setterFactory = (target, method) -> {
            String groupKey = target.name();
            String commandKey = target.name();
            return HystrixCommand.Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey(groupKey))
                    .andCommandKey(HystrixCommandKey.Factory.asKey(commandKey))
                    .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                            .withCircuitBreakerEnabled(true)
                            .withExecutionIsolationStrategy(HystrixCommandProperties.ExecutionIsolationStrategy.valueOf(hystrixProperties.getIsolationStrategy()))
                            .withExecutionTimeoutInMilliseconds(hystrixProperties.getTimout())
                            .withExecutionIsolationThreadInterruptOnTimeout(true)
                            .withCircuitBreakerRequestVolumeThreshold(hystrixProperties.getRequestVolumeThreshold())
                            .withCircuitBreakerSleepWindowInMilliseconds(hystrixProperties.getSleepWindowInMilliseconds()))
                    .andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
                            .withCoreSize(hystrixProperties.getCorePoolSize())
                            .withMaximumSize(hystrixProperties.getMaxPoolSize())
                            .withMaxQueueSize(hystrixProperties.getMaxQueueSize())
                            .withQueueSizeRejectionThreshold(hystrixProperties.getQueueSizeRejectionThreshold()));
        };
        return HystrixFeign.builder().setterFactory(setterFactory);
    }
}
