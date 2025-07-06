package org.example.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.amazonaws.regions.Regions;

@Slf4j
@Configuration
public class FirebaseConfig {

    // AWS SSM Parameter Store 경로 (환경변수 또는 application.yml에서 주입 가능)
    private static final String PARAMETER_NAME = "/sena-back/config/firebase-config";

    @PostConstruct
    public void initializeFirebase() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("Firebase already initialized, skip.");
            return;
        }

        // AWS SSM에서 파라미터 읽기
        String firebaseJson = getParameterFromSSM(PARAMETER_NAME);
        if (firebaseJson == null || firebaseJson.isEmpty()) {
            throw new IllegalStateException("Firebase service account JSON not found in SSM parameter store");
        } else {
            // 앞부분만 일부 출력 (예: 100자 이내)
            log.info("Firebase JSON from SSM parameter (preview): {}",
                    firebaseJson.length() > 100 ? firebaseJson.substring(0, 100) + "..." : firebaseJson);
        }

        try (InputStream serviceAccount = new ByteArrayInputStream(firebaseJson.getBytes(StandardCharsets.UTF_8))) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setStorageBucket("senahaza-a5333.appspot.com") // 실제 버킷명으로 변경
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase initialized successfully from SSM parameter");
        }
    }

    private String getParameterFromSSM(String name) {
        AWSSimpleSystemsManagement ssmClient = AWSSimpleSystemsManagementClientBuilder.standard()
                .withRegion(Regions.AP_NORTHEAST_2) // 서울 리전 등 실제 리전으로 수정
                .build();

        GetParameterRequest request = new GetParameterRequest()
                .withName(name)
                .withWithDecryption(true);

        GetParameterResult result = ssmClient.getParameter(request);
        return result.getParameter().getValue();
    }
}
