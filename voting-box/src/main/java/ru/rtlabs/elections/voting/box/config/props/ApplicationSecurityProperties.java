package ru.rtlabs.elections.voting.box.config.props;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
@Getter
@Setter
public class ApplicationSecurityProperties {

    private String serviceKey;
}
