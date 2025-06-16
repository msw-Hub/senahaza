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
import org.example.exception.customException.*;
import org.example.repository.ItemRepository;
import org.example.repository.UpdateLogRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URLDecoder;
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


    @Transactional
    public void createItem(ItemRequestDto itemDto, MultipartFile file) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 해당 아이템 중복 체크
        String itemName = itemDto.getItemName();
        if (itemRepository.existsByItemNameAndStatusNot(itemName, BaseEntity.Status.DELETED)) {
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

    // 이미지 업로드 메소드
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

    @Transactional
    public void updateItem(Long itemId, String itemName, Double ruby, String message, MultipartFile file, String status) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 아이템 조회
        ItemEntity itemEntity = itemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException("존재하지 않는 아이템입니다: " + itemId));

        // 2. 이미지 업로드 (파일이 있는 경우에만)
        String imageUrl = null;
        if (file != null && !file.isEmpty()) {

            String dbItemName = itemEntity.getItemName();

            // 기존 이미지 URL이 있으면 삭제
            String existingImageUrl = itemEntity.getImg();
            if (existingImageUrl != null && !existingImageUrl.isEmpty()) {
                deleteImage(existingImageUrl);
            }

            imageUrl = uploadImage(file, dbItemName);
        }

        // 3. 아이템 정보 수정
        if (itemName != null && !itemName.isEmpty() && !itemName.equals(itemEntity.getItemName())) {
            // 다른 ACTIVE 아이템 중 동일한 이름이 있으면 예외
            boolean nameExists = itemRepository.existsByItemNameAndStatusNotAndItemIdNot(
                    itemName, BaseEntity.Status.DELETED, itemId);
            if (nameExists) {
                throw new AlreadyExistingItemException("다른 아이템에서 이미 사용 중인 이름입니다: " + itemName);
            }
            itemEntity.setItemName(itemName);
        }
        if (ruby != null) {
            itemEntity.setRuby(ruby);
        }
        if (imageUrl != null) {
            itemEntity.setImg(imageUrl);
        }
        if (status != null) {
            if ((status.equals("ACTIVE") || status.equals("INACTIVE")) && !status.equals(itemEntity.getStatus().name())) {
                itemEntity.setStatus(BaseEntity.Status.valueOf(status));
            } else {
                throw new InvalidStatusException("유효하지 않은 상태 값입니다 혹은 이전과 같은 상태입니다. " + status);
            }
        }
        itemRepository.save(itemEntity);

        // 4. 아이템 수정 로그
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message(message)
                .admin(adminEntity)
                .item(itemEntity)
                .build();
        updateLogRepository.save(updateLog);

        log.info("아이템 수정 완료: {}", itemEntity.getItemName());
    }

    // 기존 이미지 삭제 메소드
    private void deleteImage(String imageUrl) {
        try {
            // 이미지 URL에서 Firebase Storage 내 경로(blobString)를 추출
            String decodedUrl = URLDecoder.decode(imageUrl, StandardCharsets.UTF_8);
            String prefix = "/o/";
            int startIndex = decodedUrl.indexOf(prefix) + prefix.length();
            int endIndex = decodedUrl.indexOf("?alt=media");
            String blobString = decodedUrl.substring(startIndex, endIndex);

            // 실제 Firebase Storage에서 파일 삭제
            boolean deleted = StorageClient.getInstance()
                    .bucket()
                    .get(blobString)
                    .delete();

            if (deleted) {
                log.info("기존 이미지 삭제 완료: {}", blobString);
            } else {
                log.warn("기존 이미지 삭제 실패: {}", blobString);
            }
        } catch (Exception e) {
            log.error("기존 이미지 삭제 중 오류 발생", e);
            throw new ImageDeleteException("이미지 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 아이템 삭제
    @Transactional
    public void deleteItem(Long itemId) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 아이템 조회
        ItemEntity itemEntity = itemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException("존재하지 않는 아이템입니다: " + itemId));

        // 2. 이미 삭제된 상태라면 예외 처리하거나 무시
        if (itemEntity.getStatus() == BaseEntity.Status.DELETED) {
            throw new InvalidStatusException("이미 삭제된 아이템입니다: " + itemId);
        }

        // 3. 상태를 DELETED로 변경
        itemEntity.setStatus(BaseEntity.Status.DELETED);
        itemRepository.save(itemEntity);

        // 5. 삭제 로그 생성
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message("아이템 삭제 처리")
                .admin(adminEntity)
                .item(itemEntity)
                .build();

        updateLogRepository.save(updateLog);

        log.info("아이템 삭제 완료: itemId={}, itemName={}", itemId, itemEntity.getItemName());
    }
}
