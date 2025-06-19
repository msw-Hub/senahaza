package org.example.admin.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import org.example.common.dto.PackageDto;
import org.example.common.dto.PackageItemDto;
import org.example.entity.BaseEntity;

import java.time.LocalDateTime;
import java.util.List;

@Data
@SuperBuilder
public class AdminPackageDto {
    private String lastModifiedBy;      // 최종 수정자 이름
    private LocalDateTime lastModifiedAt;  // 최종 수정 일시
    private String lastModifiedMessage;    // 메시지
    private BaseEntity.Status status;            // 상태

    private Long packageId;
    private String packageName;
    private Double totalRuby;
    private Double totalCash;
    private Double packagePrice;
    private List<AdminPackageItemDto> items;
}
