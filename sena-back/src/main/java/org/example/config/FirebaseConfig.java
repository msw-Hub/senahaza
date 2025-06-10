package org.example.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initializeFirebase() throws IOException {
        FirebaseOptions options;
        String json = System.getenv("FIREBASE_SERVICE_ACCOUNT");

        if (json != null && !json.isEmpty()) {
            InputStream serviceAccount = new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
            options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setStorageBucket("senahaza-a5333.firebasestorage.app")
                    .build();
        } else {
            FileInputStream serviceAccount = new FileInputStream("sena-back/config/firebase-service-account.json");
            options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setStorageBucket("senahaza-a5333.firebasestorage.app")
                    .build();
        }
        FirebaseApp.initializeApp(options);
    }
}
