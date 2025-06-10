package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
public class AdminItemResponseDto extends ItemResponseDto{

    // 최종 수정자 정보 추가
    private String lastModifiedBy;      // 최종 수정자 이름
    private LocalDateTime lastModifiedAt;  // 최종 수정 일시
    private String lastModifiedMessage;    // 메시지
}
