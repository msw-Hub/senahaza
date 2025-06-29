package org.example.admin.viewer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.*;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.common.dto.PackageItemDto;
import org.example.entity.*;
import org.example.exception.customException.*;
import org.example.jwt.RedisService;
import org.example.jwt.TokenBlacklistService;
import org.example.repository.ItemRepository;
import org.example.repository.PackageRepository;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ViewerService {

    private final AdminRepository adminRepository;
    private final ItemRepository itemRepository;
    private final PackageRepository packageRepository;
    private final TokenBlacklistService tokenBlacklistService;

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

    // 아이템 전체 목록 반환 - 관리자 관점
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
                            .imgUrl(item.getImg())
                            .status(item.getStatus())
                            .lastModifiedBy(latestLog != null ? latestLog.getAdmin().getName() : null)
                            .lastModifiedAt(latestLog != null ? latestLog.getUpdatedAt() : null)
                            .lastModifiedMessage(latestLog != null ? latestLog.getMessage() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

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
                            .max(Comparator.comparing(UpdateLogEntity::getUpdatedAt))
                            .orElse(null);

                    // DELETED가 아닌 패키지 아이템만 필터링
                    List<AdminPackageItemDto> adminItemDtos = pkg.getPackageItems().stream()
                            .filter(pi -> pi.getStatus() != BaseEntity.Status.DELETED)
                            .map(pi -> AdminPackageItemDto.builder()
                                    .itemId(pi.getItem().getItemId())
                                    .itemName(pi.getItem().getItemName())
                                    .ruby(pi.getItem().getRuby())
                                    .imgUrl(pi.getItem().getImg())
                                    .quantity(pi.getQuantity())
                                    .status(pi.getStatus())
                                    .build())
                            .collect(Collectors.toList());

                    // 총 루비 계산: ACTIVE 아이템만 대상으로 함
                    double totalRuby = pkg.getPackageItems().stream()
                            .filter(pi -> pi.getStatus() != BaseEntity.Status.DELETED)
                            .filter(pi -> pi.getItem().getStatus() == BaseEntity.Status.ACTIVE)
                            .mapToDouble(pi -> pi.getItem().getRuby() * pi.getQuantity())
                            .sum();

                    double totalCash = totalRuby * 7.5;

                    return AdminPackageDto.builder()
                            .packageId(pkg.getPackageId())
                            .packageName(pkg.getPackageName())
                            .totalRuby(totalRuby)
                            .totalCash(totalCash)
                            .packagePrice(pkg.getPackagePrice())
                            .items(adminItemDtos)
                            .status(pkg.getStatus())
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

    // 특정 아이템의 상세한 정보 조회
    @Transactional(readOnly = true)
    public ItemDetailResponseDto getItemDetail(Long itemId) {
        log.info("1. 아이템 조회 시작: itemId={}", itemId);

        ItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException("해당 아이템이 존재하지 않습니다."));

        if (item.getStatus() == BaseEntity.Status.DELETED) {
            log.warn("아이템이 삭제된 상태입니다: itemId={}", itemId);
            throw new InvalidStatusException("해당 아이템은 삭제된 상태입니다.");
        }

        log.info("2. 아이템 조회 완료: itemName={}, ruby={}, img={}", item.getItemName(), item.getRuby(), item.getImg());

        List<UpdateLogDto> updateLogDtos = item.getUpdateLogs().stream()
                .filter(log -> log.getUpdatedAt() != null)
                .sorted(Comparator.comparing(UpdateLogEntity::getUpdatedAt).reversed())
                .map(log -> UpdateLogDto.builder()
                        .adminName(log.getAdmin().getName())
                        .updatedAt(String.valueOf(log.getUpdatedAt()))
                        .message(log.getMessage())
                        .build())
                .collect(Collectors.toList());

        log.info("3. 업데이트 로그 조회 완료: 로그 수={}", updateLogDtos.size());

        List<PackageSummaryDto> packageSummaries = item.getPackageItems().stream()
                .map(PackageItemEntity::getPackageEntity)
                .filter(Objects::nonNull)
                .map(pkg -> PackageSummaryDto.builder()
                        .packageId(pkg.getPackageId())
                        .packageName(pkg.getPackageName())
                        .build())
                .collect(Collectors.toList());

        return ItemDetailResponseDto.builder()
                .itemId(item.getItemId())
                .itemName(item.getItemName())
                .ruby(item.getRuby())
                .imgUrl(item.getImg())
                .status(item.getStatus())
                .updateLogs(updateLogDtos)
                .packages(packageSummaries)
                .build();
    }

    // 특정 패키지의 상세한 정보 조회
    @Transactional(readOnly = true)
    public PackageDetailResponseDto getPackageDetail(Long packageId) {
        log.info("1. 패키지 조회 시작: packageId={}", packageId);

        PackageEntity pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new PackageNotFoundException("해당 패키지가 존재하지 않습니다. packageId=" + packageId));

        if (pkg.getStatus() == BaseEntity.Status.DELETED) {
            log.warn("삭제된 패키지입니다: packageId={}", packageId);
            throw new InvalidStatusException("해당 패키지는 삭제된 상태입니다.");
        }

        log.info("2. 패키지 조회 완료: packageName={}, price={}", pkg.getPackageName(), pkg.getPackagePrice());

        // 구성품 가져오기
        List<PackageItemEntity> packageItems = pkg.getPackageItems();

        List<PackageItemAndStatusDto> itemDtos = new ArrayList<>();
        double totalRuby = 0.0;

        for (PackageItemEntity pi : packageItems) {
            ItemEntity item = pi.getItem();
            if (item == null) continue;
            // 삭제된 아이템은 제외
            if (item.getStatus() == BaseEntity.Status.DELETED) continue;

            // 삭제는 이미 필터링 됐으니 모두 포함
            itemDtos.add(PackageItemAndStatusDto.builder()
                    .itemId(item.getItemId())
                    .itemName(item.getItemName())
                    .imgUrl(item.getImg())
                    .ruby(item.getRuby())
                    .quantity(pi.getQuantity())
                    .status(item.getStatus())
                    .build());

            // 상태가 ACTIVE인 구성품만 루비 합산
            if (item.getStatus() == BaseEntity.Status.ACTIVE) {
                totalRuby += item.getRuby() * pi.getQuantity();
            }
        }

        double totalCash = totalRuby * 7.5;

        // 패키지에 대한 업데이트 로그
        List<UpdateLogDto> updateLogs = pkg.getUpdateLogs().stream()
                .filter(log -> log.getUpdatedAt() != null)
                .sorted(Comparator.comparing(UpdateLogEntity::getUpdatedAt).reversed())
                .map(log -> UpdateLogDto.builder()
                        .adminName(log.getAdmin().getName())
                        .updatedAt(String.valueOf(log.getUpdatedAt()))
                        .message(log.getMessage())
                        .build())
                .collect(Collectors.toList());

        log.info("3. 패키지 구성품 개수={}, 업데이트 로그 개수={}", itemDtos.size(), updateLogs.size());

        return PackageDetailResponseDto.builder()
                .packageId(pkg.getPackageId())
                .packageName(pkg.getPackageName())
                .packagePrice(pkg.getPackagePrice())
                .totalRuby(totalRuby)
                .totalCash(totalCash)
                .items(itemDtos)
                .updateLogList(updateLogs)
                .status(pkg.getStatus())
                .build();
    }

    // 로그아웃 처리
    public void logout(String email, HttpServletRequest request, HttpServletResponse response) {
        // 이메일로 해당 관리자 계정 조회
        AdminEntity admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("해당 이메일의 관리자가 존재하지 않습니다."));
        // 활성 통큰 블랙리스트 처리
        tokenBlacklistService.blacklistAllActiveTokens(email);

        // 쿠키 삭제 처리
        Cookie deleteCookie = new Cookie("token", null);
        deleteCookie.setHttpOnly(true);
        deleteCookie.setSecure(true);
        deleteCookie.setPath("/");
        deleteCookie.setMaxAge(0);
        response.addCookie(deleteCookie);
    }
    // 관리자 이름과 권한 조회 - 이메일로
    public Map<String, String> getAdminInfo(String email) {
        AdminEntity admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("해당 이메일의 관리자가 존재하지 않습니다."));

        Map<String, String> adminInfo = new HashMap<>();
        adminInfo.put("name", admin.getName());
        adminInfo.put("role", admin.getRole().name());
        return adminInfo;
    }
}
