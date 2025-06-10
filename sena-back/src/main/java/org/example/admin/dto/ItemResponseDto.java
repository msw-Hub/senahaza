package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ItemResponseDto {

    private Long itemId;
    private String itemName;
    private Long ruby;
    private String img;

    // 최종 수정자 정보 추가
    private String lastModifiedBy;      // 최종 수정자 이름
    private LocalDateTime lastModifiedAt;  // 최종 수정 일시
    private String lastModifiedMessage;    // 메시지
}
