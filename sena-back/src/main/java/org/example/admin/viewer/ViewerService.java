package org.example.admin.viewer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminItemResponseDto;
import org.example.admin.dto.ItemResponseDto;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.entity.BaseEntity;
import org.example.entity.ItemEntity;
import org.example.entity.UpdateLogEntity;
import org.example.exception.customException.AdminNotFoundException;
import org.example.exception.customException.AdminStatusInvalidException;
import org.example.repository.ItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ViewerService {

    private final AdminRepository adminRepository;
    private final ItemRepository itemRepository;

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

    @Transactional
    public List<AdminItemResponseDto> getItemList() {
        List<ItemEntity> itemEntities = itemRepository.findAll();

        if (itemEntities.isEmpty()) {
            log.info("아이템 목록이 비어 있습니다.");
            return Collections.emptyList();
        }

        return itemEntities.stream()
                .filter(item -> item.getStatus() == BaseEntity.Status.ACTIVE)
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


}
