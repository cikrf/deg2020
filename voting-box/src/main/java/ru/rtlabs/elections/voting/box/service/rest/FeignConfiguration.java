package ru.rtlabs.elections.voting.box.service.rest;

import feign.RequestInterceptor;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import ru.rtlabs.elections.voting.box.config.props.ApplicationSecurityProperties;

@Configuration
@AllArgsConstructor
public class FeignConfiguration {

    private final ApplicationSecurityProperties applicationProperties;

    @Bean
    public RequestInterceptor requestTokenBearerInterceptor() {
        return requestTemplate -> requestTemplate.header(HttpHeaders.AUTHORIZATION, applicationProperties.getServiceKey());
    }
}
