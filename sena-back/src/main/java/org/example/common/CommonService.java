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
                        .img(item.getImg())
                        .build())
                .collect(Collectors.toList());
    }

    // 패키지 전체 목록 반환
    @Transactional(readOnly = true)
    public PackageListResponseDto getPackages() {
        // 1. 활성화된 패키지 조회
        List<PackageEntity> packageEntities = packageRepository.findAllByStatus(BaseEntity.Status.ACTIVE);

        // 2. 각 패키지를 DTO로 변환
        List<PackageDto> packageDtos = packageEntities.stream()
                .map(pkg -> {
                    // 구성 아이템 필터링 및 매핑 (아이템이 ACTIVE 상태인 경우만)
                    List<PackageItemDto> itemDtos = pkg.getPackageItems().stream()
                            .filter(pi -> pi.getItem().getStatus() == BaseEntity.Status.ACTIVE)
                            .map(pi -> PackageItemDto.builder()
                                    .itemId(pi.getItem().getItemId())
                                    .itemName(pi.getItem().getItemName())
                                    .ruby(pi.getItem().getRuby())
                                    .imgUrl(pi.getItem().getImg())
                                    .quantity(pi.getQuantity())
                                    .build()
                            )
                            .collect(Collectors.toList());

                    // 총 루비, 총 현금 계산
                    double totalRuby = itemDtos.stream()
                            .mapToDouble(i -> i.getRuby() * i.getQuantity())
                            .sum();

                    Double totalCash = totalRuby * 7.5; // 예시 환율 10원

                    return PackageDto.builder()
                            .packageId(pkg.getPackageId())
                            .packageName(pkg.getPackageName())
                            .totalRuby(totalRuby)
                            .totalCash(totalCash)
                            .items(itemDtos)
                            .build();
                })
                .collect(Collectors.toList());

        // 3. 마지막 업데이트 일시 (전체 기준)
        LocalDateTime latestUpdated = packageEntities.stream()
                .flatMap(pkg -> pkg.getUpdateLogs().stream())
                .map(UpdateLogEntity::getUpdatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        String lastUpdatedAt = latestUpdated != null
                ? latestUpdated.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : null;

        return PackageListResponseDto.builder()
                .lastUpdatedAt(lastUpdatedAt)
                .packages(packageDtos)
                .build();
    }
}
