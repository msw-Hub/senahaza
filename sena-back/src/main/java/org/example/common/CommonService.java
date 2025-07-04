package org.example.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.ItemResponseDto;
import org.example.common.dto.PackageDto;
import org.example.common.dto.PackageItemDto;
import org.example.common.dto.PackageListResponseDto;
import org.example.entity.BaseEntity;
import org.example.entity.ItemEntity;
import org.example.entity.PackageEntity;
import org.example.entity.UpdateLogEntity;
import org.example.repository.ItemRepository;
import org.example.repository.PackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonService {

    private final ItemRepository itemRepository;
    private final PackageRepository packageRepository;

    // 아이템 전체 목록 반환 - 활성화 아이템만
    @Transactional(readOnly = true)
    public List<ItemResponseDto> getItems() {
        List<ItemEntity> activeItems = itemRepository.findAllByStatus(BaseEntity.Status.ACTIVE);

        return activeItems.stream()
                .map(item -> ItemResponseDto.builder()
                        .itemId(item.getItemId())
                        .itemName(item.getItemName())
                        .ruby(item.getRuby())
                        .imgUrl(item.getImg())
                        .build())
                .collect(Collectors.toList());
    }

    // 패키지 전체 목록 반환
    @Transactional(readOnly = true)
    public PackageListResponseDto getPackages() {
        log.info("1. 패키지 조회 시작");

        List<PackageEntity> packageEntities = packageRepository.findAllByStatus(BaseEntity.Status.ACTIVE);
        log.info("2. 패키지 개수: {}", packageEntities.size());

        List<PackageDto> packageDtos = packageEntities.stream()
                .map(pkg -> {
                    log.info("3. 패키지 ID: {}", pkg.getPackageId());
                    log.info("3-1. 구성품 수: {}", pkg.getPackageItems().size());

                    // 활성화된 구성품 + 활성화된 아이템만 포함
                    List<PackageItemDto> itemDtos = pkg.getPackageItems().stream()
                            .filter(pi -> pi.getStatus() == BaseEntity.Status.ACTIVE) // 구성품이 ACTIVE
                            .filter(pi -> pi.getItem().getStatus() == BaseEntity.Status.ACTIVE) // 아이템이 ACTIVE
                            .map(pi -> {
                                log.info("4. 아이템 이름: {}", pi.getItem().getItemName());
                                return PackageItemDto.builder()
                                        .itemId(pi.getItem().getItemId())
                                        .itemName(pi.getItem().getItemName())
                                        .ruby(pi.getItem().getRuby())
                                        .imgUrl(pi.getItem().getImg())
                                        .quantity(pi.getQuantity())
                                        .build();
                            })
                            .collect(Collectors.toList());

                    double totalRuby = itemDtos.stream()
                            .mapToDouble(i -> i.getRuby() * i.getQuantity())
                            .sum();

                    Double totalCash = totalRuby * 7.5;

                    return PackageDto.builder()
                            .packageId(pkg.getPackageId())
                            .packageName(pkg.getPackageName())
                            .totalRuby(totalRuby)
                            .totalCash(totalCash)
                            .packagePrice(pkg.getPackagePrice())
                            .items(itemDtos)
                            .build();
                })
                .collect(Collectors.toList());

        log.info("5. 패키지 DTO 변환 완료");

        LocalDateTime latestUpdated = packageEntities.stream()
                .flatMap(pkg -> pkg.getUpdateLogs().stream())
                .map(UpdateLogEntity::getUpdatedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        String lastUpdatedAt = latestUpdated != null
                ? latestUpdated.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : null;

        log.info("6. 최종 응답 준비 완료");

        return PackageListResponseDto.builder()
                .lastUpdatedAt(lastUpdatedAt)
                .packages(packageDtos)
                .build();
    }

}
