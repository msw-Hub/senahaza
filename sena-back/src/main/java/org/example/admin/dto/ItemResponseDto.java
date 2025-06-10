package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ItemResponseDto {

    private Long itemId;
    private String itemName;
    private Long ruby;
    private String img;
}
