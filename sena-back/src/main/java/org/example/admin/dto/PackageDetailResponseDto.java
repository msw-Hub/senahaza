package org.example.admin.dto;

import lombok.Data;
import lombok.experimental.SuperBuilder;
import org.example.entity.BaseEntity;

import java.util.List;

@Data
@SuperBuilder
public class PackageDetailResponseDto {
    private Long packageId;
    private String packageName;
    private Double totalRuby;
    private Double totalCash;
    private Double packagePrice;
    private List<PackageItemAndStatusDto> items;
    private List<UpdateLogDto> updateLogList; // 패키지 업데이트 로그 목록
    private BaseEntity.Status status; // 패키지 상태
}
