package org.example.config;

import com.amazonaws.regions.Regions;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.google.analytics.data.v1beta.BetaAnalyticsDataClient;
import com.google.analytics.data.v1beta.BetaAnalyticsDataSettings;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PreDestroy;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Configuration
public class AnalyticsConfig {

    // AWS SSM Parameter Store 내 JSON 경로
    private static final String PARAMETER_NAME = "/sena-back/config/google-credentials";

    @Value("${analytics.google.property-id}")
    private String propertyId;

    private BetaAnalyticsDataClient analyticsClient;

    @Bean
    public BetaAnalyticsDataClient analyticsDataClient() throws IOException {
        log.info("Initializing Google Analytics Data Client");
        log.debug("Property ID: {}", propertyId);

        // SSM에서 직접 JSON 문자열 읽기
        String credentialsJson = getParameterFromSSM(PARAMETER_NAME);
        if (credentialsJson == null || credentialsJson.isEmpty()) {
            throw new IllegalStateException("Google Analytics credentials JSON not found in SSM parameter store");
        }

        GoogleCredentials credentials = loadGoogleCredentials(credentialsJson);

        BetaAnalyticsDataSettings settings = BetaAnalyticsDataSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                .build();

        this.analyticsClient = BetaAnalyticsDataClient.create(settings);

        log.info("Google Analytics Data Client initialized successfully");
        return this.analyticsClient;
    }

    @Bean
    public String analyticsPropertyId() {
        return "properties/" + propertyId;
    }

    private GoogleCredentials loadGoogleCredentials(String credentialsJson) throws IOException {
        log.debug("Loading Google credentials from JSON string");
        try (InputStream credentialsStream = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8))) {
            return ServiceAccountCredentials
                    .fromStream(credentialsStream)
                    .createScoped("https://www.googleapis.com/auth/analytics.readonly");
        }
    }

    private String getParameterFromSSM(String name) {
        AWSSimpleSystemsManagement ssmClient = AWSSimpleSystemsManagementClientBuilder.standard()
                .withRegion(Regions.AP_NORTHEAST_2) // 서울 리전으로 변경 가능
                .build();

        GetParameterRequest request = new GetParameterRequest()
                .withName(name)
                .withWithDecryption(true);

        GetParameterResult result = ssmClient.getParameter(request);
        return result.getParameter().getValue();
    }

    @PreDestroy
    public void cleanup() {
        if (analyticsClient != null) {
            log.info("Shutting down Google Analytics Data Client");
            analyticsClient.shutdown();
        }
    }
}
