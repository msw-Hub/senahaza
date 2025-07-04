package org.example.admin.editor;

import com.google.firebase.cloud.StorageClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.ItemRequestDto;
import org.example.admin.dto.PackageCreateRequestDto;
import org.example.admin.dto.PackageItemCreateDto;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.entity.*;
import org.example.exception.customException.*;
import org.example.repository.ItemRepository;
import org.example.repository.PackageItemRepository;
import org.example.repository.PackageRepository;
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
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EditorService {

    private final AdminRepository adminRepository;
    private final ItemRepository itemRepository;
    private final UpdateLogRepository updateLogRepository;
    private final PackageRepository packageRepository;
    private final PackageItemRepository packageItemRepository;


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
    public void updateItem(Long itemId, String itemName, Double ruby, String message, MultipartFile file) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 아이템 조회
        ItemEntity itemEntity = itemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException("존재하지 않는 아이템입니다: " + itemId));

        // 이미 삭제된 상태라면 예외 처리
        if (itemEntity.getStatus() == BaseEntity.Status.DELETED) {
            throw new InvalidStatusException("이미 삭제된 아이템입니다: " + itemId);
        }

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
    // 아이템 상태 변경
    @Transactional
    public void changeItemStatus(Long itemId, BaseEntity.Status status) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 아이템 조회
        ItemEntity itemEntity = itemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException("존재하지 않는 아이템입니다: " + itemId));

        // 2. 상태 중복 및 유효성 검사
        if (itemEntity.getStatus() == status) {
            throw new InvalidStatusException("이미 해당 상태입니다: " + status);
        }
        if (status != BaseEntity.Status.ACTIVE && status != BaseEntity.Status.INACTIVE) {
            throw new InvalidStatusException("유효하지 않은 상태입니다: " + status);
        }

        // 3. 아이템 상태 변경
        itemEntity.setStatus(status);
        itemRepository.save(itemEntity);

        // 4. 아이템이 포함된 모든 패키지 아이템도 상태 동기화
        List<PackageItemEntity> relatedPackageItems = packageItemRepository.findByItem(itemEntity);
        for (PackageItemEntity pi : relatedPackageItems) {
            pi.setStatus(status);
        }
        packageItemRepository.saveAll(relatedPackageItems);

        // 5. 상태 변경 로그 작성
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message("아이템 상태 변경: " + status)
                .admin(adminEntity)
                .item(itemEntity)
                .build();
        updateLogRepository.save(updateLog);

        log.info("아이템 및 관련 패키지아이템 상태 변경 완료: itemId={}, newStatus={}", itemId, status);
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

        // ✅ 4. 아이템이 속한 모든 PackageItemEntity 상태도 함께 DELETED 처리
        List<PackageItemEntity> relatedPackageItems = packageItemRepository.findByItem(itemEntity);
        for (PackageItemEntity pi : relatedPackageItems) {
            pi.setStatus(BaseEntity.Status.DELETED);
        }
        packageItemRepository.saveAll(relatedPackageItems);

        // 5. 삭제 로그 작성
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message("아이템 삭제 처리")
                .admin(adminEntity)
                .item(itemEntity)
                .build();
        updateLogRepository.save(updateLog);

        log.info("아이템 삭제 완료: itemId={}, itemName={}", itemId, itemEntity.getItemName());
    }

    // 패키지 등록 로직
    @Transactional
    public void createPackage(PackageCreateRequestDto dto) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 패키지 이름 중복 체크
        if (packageRepository.existsByPackageNameAndStatusNot(dto.getPackageName(), BaseEntity.Status.DELETED)) {
            log.warn("패키지 이름 중복: {}", dto.getPackageName());
            throw new AlreadyExistingItemException("이미 존재하는 패키지 이름입니다: " + dto.getPackageName());
        }

        // 2. 패키지 Entity 생성
        PackageEntity newPackage = PackageEntity.builder()
                .packageName(dto.getPackageName())
                .status(BaseEntity.Status.ACTIVE) // 활성 상태로 설정
                .packagePrice(dto.getPackagePrice())
                .build();

        // 2-1. 패키지 아이템 리스트 생성
        List<PackageItemEntity> packageItems = dto.getItems().stream()
                .map(itemDto -> {
                    // 아이템 엔티티 조회
                    ItemEntity item = itemRepository.findById(itemDto.getItemId())
                            .orElseThrow(() -> new ItemNotFoundException("아이템을 찾을 수 없습니다: " + itemDto.getItemId()));

                    return PackageItemEntity.builder()
                            .packageEntity(newPackage)
                            .item(item)
                            .quantity(itemDto.getQuantity())
                            .status(BaseEntity.Status.ACTIVE) // 활성 상태로 설정
                            .build();
                })
                .collect(Collectors.toList());

        // 패키지에 아이템 리스트 설정
        newPackage.setPackageItems(packageItems);

        // 패키지 저장 (cascade 설정에 따라 packageItems도 저장됨)
        packageRepository.save(newPackage);

        // 3. 패키지 생성 로그 작성
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message("패키지 생성: " + dto.getPackageName())
                .admin(adminEntity)
                .packageEntity(newPackage)  // 연관 관계 설정 필요
                .build();

        updateLogRepository.save(updateLog);

        log.info("패키지 생성 완료: {}", dto.getPackageName());
    }

    // 패키지 수정 로직
    @Transactional
    public void updatePackage(Long packageId, PackageCreateRequestDto dto) {
        log.info("updatePackage 시작: packageId={}, dto={}", packageId, dto);

        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("현재 관리자 email: {}", email);
        AdminEntity admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 패키지 조회
        PackageEntity pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new PackageNotFoundException("패키지를 찾을 수 없습니다."));
        log.info("패키지 조회 성공: {}", pkg.getPackageName());

        // 수정 전 값 보관
        String originalName = pkg.getPackageName();
        Double originalPrice = pkg.getPackagePrice();

        // 2. 패키지 이름 변경
        if (!pkg.getPackageName().equals(dto.getPackageName())) {
            log.info("패키지 이름 변경 시도: {} -> {}", originalName, dto.getPackageName());
            boolean exists = packageRepository.existsByPackageNameAndStatusNotAndPackageIdNot(
                    dto.getPackageName(), BaseEntity.Status.DELETED, packageId
            );
            if (exists) {
                throw new AlreadyExistingItemException("이미 존재하는 패키지 이름입니다: " + dto.getPackageName());
            }
            pkg.setPackageName(dto.getPackageName());
        }

        // 3. 패키지 가격 변경
        if (!Objects.equals(pkg.getPackagePrice(), dto.getPackagePrice())) {
            log.info("패키지 가격 변경 시도: {} -> {}", originalPrice, dto.getPackagePrice());
            pkg.setPackagePrice(dto.getPackagePrice());
        }

        // 4. 기존 구성 아이템 제거
        log.info("기존 구성 아이템 제거: {}개", pkg.getPackageItems().size());
        pkg.getPackageItems().clear();  // orphanRemoval = true 이므로 삭제 처리 됨

        // 5. 새 구성 아이템 등록
        Set<Long> seen = new HashSet<>();
        for (PackageItemCreateDto itemDto : dto.getItems()) {
            if (!seen.add(itemDto.getItemId())) {
                throw new AlreadyExistingItemException("아이템이 중복되었습니다: " + itemDto.getItemId());
            }
            ItemEntity item = itemRepository.findById(itemDto.getItemId())
                    .orElseThrow(() -> new ItemNotFoundException("아이템을 찾을 수 없습니다: " + itemDto.getItemId()));

            PackageItemEntity packageItem = PackageItemEntity.builder()
                    .item(item)
                    .quantity(itemDto.getQuantity())
                    .packageEntity(pkg)
                    .status(BaseEntity.Status.ACTIVE) // 활성 상태로 설정
                    .build();

            pkg.getPackageItems().add(packageItem);
            log.info("새 아이템 추가: itemId={}, quantity={}", itemDto.getItemId(), itemDto.getQuantity());
        }

//        // 6. 저장
//        packageRepository.save(pkg);
//        log.info("패키지 저장 완료");

        try {
            packageRepository.save(pkg);
            log.info("패키지 저장 완료");
        } catch (Exception ex) {
            log.error("패키지 저장 중 오류 발생", ex);
            throw ex;  // 예외 재던지기 (없으면 서비스가 정상 종료됨)
        }

        // 7. 패키지 수정 로그 작성
        StringBuilder logMsg = new StringBuilder("패키지 수정: ");
        if (!originalName.equals(dto.getPackageName())) {
            logMsg.append("[이름 변경] ");
        }
        if (!Objects.equals(originalPrice, dto.getPackagePrice())) {
            logMsg.append("[가격 변경] ");
        }
        logMsg.append("[구성 변경] ");

        if (dto.getMessage() != null) {
            logMsg.append(dto.getMessage());
        }

        updateLogRepository.save(UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message(logMsg.toString())
                .admin(admin)
                .packageEntity(pkg)
                .build());

        log.info("패키지 수정 완료: {}", pkg.getPackageName());
    }


    // 패키지 삭제 로직
    @Transactional
    public void deletePackage(Long packageId) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 패키지 조회
        PackageEntity packageEntity = packageRepository.findById(packageId)
                .orElseThrow(() -> new PackageNotFoundException("존재하지 않는 패키지입니다: " + packageId));

        // 2. 이미 삭제된 상태라면 예외 처리
        if (packageEntity.getStatus() == BaseEntity.Status.DELETED) {
            throw new InvalidStatusException("이미 삭제된 패키지입니다: " + packageId);
        }

        // 3. 상태를 DELETED로 변경
        packageEntity.setStatus(BaseEntity.Status.DELETED);
        packageRepository.save(packageEntity);

        // 4. 패키지 삭제 로그 작성
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message("패키지 삭제 처리")
                .admin(adminEntity)
                .packageEntity(packageEntity)  // 연관 관계 설정 필요
                .build();
        updateLogRepository.save(updateLog);

        log.info("패키지 삭제 완료: packageId={}, packageName={}", packageId, packageEntity.getPackageName());
    }

    // 패키지 상태 변경
    @Transactional
    public void changePackageStatus(Long packageId, BaseEntity.Status status) {
        // 0. 현재 작업하는 관리자 정보 조회
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AdminEntity adminEntity = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("관리자 정보를 찾을 수 없습니다."));

        // 1. 패키지 조회
        PackageEntity packageEntity = packageRepository.findById(packageId)
                .orElseThrow(() -> new PackageNotFoundException("존재하지 않는 패키지입니다: " + packageId));

        // 2. 상태 변경
        if (packageEntity.getStatus() == status) {
            throw new InvalidStatusException("이미 해당 상태입니다: " + status);
        }
        if (status != BaseEntity.Status.ACTIVE && status != BaseEntity.Status.INACTIVE) {
            throw new InvalidStatusException("유효하지 않은 패키지 상태입니다: " + status);
        }
        packageEntity.setStatus(status);

        packageRepository.save(packageEntity);

        // 3. 패키지 상태 변경 로그 작성
        UpdateLogEntity updateLog = UpdateLogEntity.builder()
                .updatedAt(LocalDateTime.now())
                .message("패키지 상태 변경: " + status)
                .admin(adminEntity)
                .packageEntity(packageEntity)  // 연관 관계 설정 필요
                .build();
        updateLogRepository.save(updateLog);
        log.info("패키지 상태 변경 완료: packageId={}, newStatus={}", packageId, status);
    }
}
