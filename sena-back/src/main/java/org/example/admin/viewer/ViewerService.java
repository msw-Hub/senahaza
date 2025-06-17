package org.example.admin.viewer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminItemResponseDto;
import org.example.admin.dto.AdminPackageDto;
import org.example.admin.dto.AdminPackageResponseDto;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.common.dto.PackageItemDto;
import org.example.entity.BaseEntity;
import org.example.entity.ItemEntity;
import org.example.entity.PackageEntity;
import org.example.entity.UpdateLogEntity;
import org.example.exception.customException.AdminNotFoundException;
import org.example.exception.customException.AdminStatusInvalidException;
import org.example.repository.ItemRepository;
import org.example.repository.PackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ViewerService {

    private final AdminRepository adminRepository;
    private final ItemRepository itemRepository;
    private final PackageRepository packageRepository;

    public void checkStatus(String email) {
        // 이메일로 해당 관리자 계정 조회
        AdminEntity admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("해당 이메일의 관리자가 존재하지 않습니다."));

        //해당 유저의 상태가 ACTIVE인지 확인
        if (admin.getStatus().equals(BaseEntity.Status.valueOf("ACTIVE"))) {
            log.info("유효성 확인 완료: 이메일 = {}, 상태 = {}", email, admin.getStatus());
        } else {
            log.warn("유효성 확인 실패: 이메일 = {}, 상태 = {}", email, admin.getStatus());
            throw new AdminStatusInvalidException("해당 관리자의 상태가 유효하지 않습니다.");
        }
    }

    @Transactional(readOnly = true)
    public List<AdminItemResponseDto> getItemList() {
        List<ItemEntity> itemEntities = itemRepository.findByStatusNot(BaseEntity.Status.DELETED);

        if (itemEntities.isEmpty()) {
            log.info("아이템 목록이 비어 있습니다.");
            return Collections.emptyList();
        }

        return itemEntities.stream()
                .map(item -> {
                    UpdateLogEntity latestLog = item.getUpdateLogs().stream()
                            .filter(log -> log.getUpdatedAt() != null)
                            .max(Comparator.comparing(UpdateLogEntity::getUpdatedAt))
                            .orElse(null);

                    return AdminItemResponseDto.builder()
                            .itemId(item.getItemId())
                            .itemName(item.getItemName())
                            .ruby(item.getRuby())
                            .img(item.getImg())
                            .lastModifiedBy(latestLog != null ? latestLog.getAdmin().getName() : null)
                            .lastModifiedAt(latestLog != null ? latestLog.getUpdatedAt() : null)
                            .lastModifiedMessage(latestLog != null ? latestLog.getMessage() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // 관리자 기준 패키지 정보 조회
    @Transactional(readOnly = true)
    public AdminPackageResponseDto getPackageInfo() {
        log.info("1. 삭제되지 않은 패키지 조회 시작");

        List<PackageEntity> packageEntities = packageRepository.findByStatusNot(BaseEntity.Status.DELETED);
        log.info("2. 조회된 패키지 수: {}", packageEntities.size());

        List<AdminPackageDto> packageDtos = packageEntities.stream()
                .map(pkg -> {
                    log.info("3. 패키지 ID: {}, 이름: {}", pkg.getPackageId(), pkg.getPackageName());

                    // 최신 업데이트 로그 찾기
                    UpdateLogEntity latestLog = pkg.getUpdateLogs().stream()
                            .filter(log -> log.getUpdatedAt() != null)
                            .max((a, b) -> a.getUpdatedAt().compareTo(b.getUpdatedAt()))
                            .orElse(null);

                    List<PackageItemDto> itemDtos = pkg.getPackageItems().stream()
                            .map(pi -> PackageItemDto.builder()
                                    .itemId(pi.getItem().getItemId())
                                    .itemName(pi.getItem().getItemName())
                                    .ruby(pi.getItem().getRuby())
                                    .imgUrl(pi.getItem().getImg())
                                    .quantity(pi.getQuantity())
                                    .build())
                            .collect(Collectors.toList());

                    double totalRuby = itemDtos.stream()
                            .mapToDouble(i -> i.getRuby() * i.getQuantity())
                            .sum();
                    double totalCash = totalRuby * 7.5;

                    return AdminPackageDto.builder()
                            .packageId(pkg.getPackageId())
                            .packageName(pkg.getPackageName())
                            .totalRuby(totalRuby)
                            .totalCash(totalCash)
                            .packagePrice(pkg.getPackagePrice())
                            .items(itemDtos)
                            .lastModifiedBy(latestLog != null ? latestLog.getAdmin().getName() : null)
                            .lastModifiedAt(latestLog != null ? latestLog.getUpdatedAt() : null)
                            .lastModifiedMessage(latestLog != null ? latestLog.getMessage() : null)
                            .build();
                })
                .collect(Collectors.toList());

        log.info("4. 패키지 DTO 생성 완료");

        LocalDateTime latestUpdated = packageEntities.stream()
                .flatMap(pkg -> pkg.getUpdateLogs().stream())
                .map(UpdateLogEntity::getUpdatedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        String lastUpdatedAt = latestUpdated != null
                ? latestUpdated.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : null;

        return AdminPackageResponseDto.builder()
                .lastUpdatedAt(lastUpdatedAt)
                .packages(packageDtos)
                .build();
    }

}
