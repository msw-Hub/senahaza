package org.example.fire;

import com.google.firebase.cloud.StorageClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

//@Component
public class FirebaseStorageTest implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        // 1. 업로드할 파일 경로
        InputStream file = new FileInputStream("sena-back/src/main/resources/images/test.jpg");

        // 2. Firebase Storage 내 저장 경로
        String blobString = "test/test-image.png";

        // 3. 파일 업로드
        StorageClient.getInstance()
                .bucket()
                .create(blobString, file, "image/png");

        // 4. 공개 URL 생성
        String bucketName = StorageClient.getInstance().bucket().getName();
        String encodedPath = URLEncoder.encode(blobString, StandardCharsets.UTF_8);
        String publicUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodedPath + "?alt=media";

        System.out.println("✅ 업로드 성공! 공개 URL:");
        System.out.println(publicUrl);
    }
}
