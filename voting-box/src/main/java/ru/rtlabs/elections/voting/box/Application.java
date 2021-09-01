package ru.rtlabs.elections.voting.box;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

@ConfigurationPropertiesScan("ru.rtlabs.elections.voting.box.config.props")
@EnableEurekaClient
@EnableFeignClients(basePackages = "ru.rtlabs.elections.voting.box.service.rest")
@EnableCircuitBreaker
@EnableSwagger2
@SpringBootApplication
@EnableJpaRepositories(basePackages = "ru.rtlabs.elections.voting.box.repository")
@EnableTransactionManagement
@EnableJpaAuditing
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
