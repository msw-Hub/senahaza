package org.example.config;

import com.google.analytics.data.v1beta.BetaAnalyticsDataClient;
import com.google.analytics.data.v1beta.BetaAnalyticsDataSettings;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import javax.annotation.PreDestroy;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Configuration
public class AnalyticsConfig {

    // application.yml에서 주입받는 서비스 계정 JSON 파일 경로
    @Value("${analytics.google.credentials-path}")
    private String credentialsPath;

    // Google Analytics Property ID (숫자형태)
    @Value("${analytics.google.property-id}")
    private String propertyId;

    // GA Data API 클라이언트 객체
    private BetaAnalyticsDataClient analyticsClient;

    /**
     * Google Analytics Data API 클라이언트를 생성하고 스프링 빈으로 등록
     * @return BetaAnalyticsDataClient 인스턴스
     * @throws IOException 키 파일 읽기 실패 시 예외 발생
     */
    @Bean
    public BetaAnalyticsDataClient analyticsDataClient() throws IOException {
        log.info("Initializing Google Analytics Data Client");
        log.debug("Credentials path: {}", credentialsPath);
        log.debug("Property ID: {}", propertyId);

        // 서비스 계정 자격증명 로드
        GoogleCredentials credentials = loadGoogleCredentials();

        // API 호출을 위한 클라이언트 설정 생성
        BetaAnalyticsDataSettings settings = BetaAnalyticsDataSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                .build();

        // 클라이언트 생성 및 할당
        this.analyticsClient = BetaAnalyticsDataClient.create(settings);

        log.info("Google Analytics Data Client initialized successfully");
        return this.analyticsClient;
    }

    /**
     * GA Property ID를 "properties/{id}" 형식으로 반환하는 빈
     * @return propertyId를 포함한 문자열
     */
    @Bean
    public String analyticsPropertyId() {
        return "properties/" + propertyId;
    }

    /**
     * 서비스 계정 JSON 파일에서 GoogleCredentials 객체를 생성한다.
     * @return GoogleCredentials
     * @throws IOException
     */
    private GoogleCredentials loadGoogleCredentials() throws IOException {
        log.debug("Loading Google credentials from: {}", credentialsPath);

        // 파일이나 클래스패스 경로에 따라 InputStream 생성
        try (InputStream credentialsStream = getCredentialsInputStream()) {
            GoogleCredentials credentials = ServiceAccountCredentials
                    .fromStream(credentialsStream)
                    .createScoped("https://www.googleapis.com/auth/analytics.readonly");

            log.debug("Google credentials loaded successfully");
            return credentials;
        }
    }

    /**
     * credentialsPath 경로가 classpath인지, 파일시스템 경로인지 구분하여 InputStream 반환
     * @return InputStream of the service account key
     * @throws IOException
     */
    private InputStream getCredentialsInputStream() throws IOException {
        if (credentialsPath.startsWith("classpath:")) {
            // classpath 경로 처리
            String resourcePath = credentialsPath.substring("classpath:".length());
            Resource resource = new ClassPathResource(resourcePath);

            if (!resource.exists()) {
                throw new IOException("Credentials file not found: " + credentialsPath);
            }

            return resource.getInputStream();
        } else {
            // 절대경로 또는 상대경로 파일 처리
            File file = new File(credentialsPath);
            if (!file.exists()) {
                throw new IOException("Credentials file not found: " + credentialsPath);
            }

            return new FileInputStream(file);
        }
    }

    /**
     * 애플리케이션 종료 시 Google Analytics 클라이언트 리소스 정리
     */
    @PreDestroy
    public void cleanup() {
        if (analyticsClient != null) {
            log.info("Shutting down Google Analytics Data Client");
            analyticsClient.shutdown();
        }
    }
}
