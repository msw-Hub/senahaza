package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminPackageResponseDto {
    private String lastUpdatedAt; // 패키지 목록의 마지막 업데이트 시간
    private List<AdminPackageDto> packages; // 패키지 목록
}
