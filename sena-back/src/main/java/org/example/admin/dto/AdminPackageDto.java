package org.example.admin.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import org.example.common.dto.PackageDto;

import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class AdminPackageDto extends PackageDto {
    private String lastModifiedBy;      // 최종 수정자 이름
    private LocalDateTime lastModifiedAt;  // 최종 수정 일시
    private String lastModifiedMessage;    // 메시지
}
