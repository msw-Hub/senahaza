package org.example.admin.editor;

import com.google.firebase.cloud.StorageClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.ItemRequestDto;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.entity.BaseEntity;
import org.example.entity.ItemEntity;
import org.example.entity.UpdateLogEntity;
import org.example.exception.customException.AdminNotFoundException;
import org.example.exception.customException.AlreadyExistingItemException;
import org.example.exception.customException.ImageUploadException;
import org.example.exception.customException.InvalidFileException;
import org.example.repository.ItemRepository;
import org.example.repository.UpdateLogRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EditorService {

    private final AdminRepository adminRepository;
    private final ItemRepository itemRepository;
    private final UpdateLogRepository updateLogRepository;

    // 이미지 업로드 메소드
    @Transactional
    public void createItem(ItemRequestDto itemDto, MultipartFile file) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 해당 아이템 중복 체크
        String itemName = itemDto.getItemName();
        if (itemRepository.existsByItemName(itemName)) {
            log.warn("아이템 이름 중복: {}", itemName);
            throw new AlreadyExistingItemException("이미 존재하는 아이템 이름입니다: " + itemName);
        }

        // 2. 이미지 업로드
        String imageUrl = uploadImage(file, itemName);

        // 3. db에 아이템 정보 저장
        // 예시: itemDto에 imageUrl 세팅 후 저장
        ItemEntity itemEntity = ItemEntity.builder()
                .itemName(itemName)
                .ruby(itemDto.getRuby())
                .img(imageUrl)
                .status(BaseEntity.Status.ACTIVE)
                .build();

        itemRepository.save(itemEntity);

        // 4. 아이템 생성 로그
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message(itemDto.getMessage())
                .admin(adminEntity)
                .item(itemEntity)
                .build();

        updateLogRepository.save(updateLog);

        log.info("아이템 생성 완료: {}", itemName);
    }

    private String uploadImage(MultipartFile file, String itemName) {
        try (InputStream inputStream = file.getInputStream()) {
            // 원본 파일명과 확장자 분리
            String originalFileName = file.getOriginalFilename();
            if (originalFileName == null) {
                throw new InvalidFileException("파일 이름이 비어 있습니다.");
            }

            String ext = "";
            int dotIndex = originalFileName.lastIndexOf(".");
            if (dotIndex != -1) {
                ext = originalFileName.substring(dotIndex); // ".jpg" 등
            }

            // UUID 생성 및 파일명 조합
            String uuid = UUID.randomUUID().toString();
            String newFileName = itemName + "-" + uuid + ext;

            // Firebase Storage 경로 설정
            String blobString = "items/" + newFileName;

            // 파일 업로드
            StorageClient.getInstance()
                    .bucket()
                    .create(blobString, inputStream, file.getContentType());

            // 공개 URL 생성
            String bucketName = StorageClient.getInstance().bucket().getName();
            String encodedPath = URLEncoder.encode(blobString, StandardCharsets.UTF_8);
            String publicUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/" + encodedPath + "?alt=media";

            log.info("이미지 업로드 완료: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("이미지 업로드 실패", e);
            throw new ImageUploadException("이미지 업로드 중 오류가 발생했습니다.");
        }
    }

}
