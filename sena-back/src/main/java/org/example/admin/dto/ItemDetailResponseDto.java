package org.example.admin.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import org.example.entity.BaseEntity;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
public class ItemDetailResponseDto extends ItemResponseDto {

    // 이 아이템이 속해 있는 패키지 정보 리스트
    private List<PackageSummaryDto> packages;

    // 이 아이템의 수정 로그 리스트
    private List<UpdateLogDto> updateLogs;

    private BaseEntity.Status status; // 아이템 상태
}
