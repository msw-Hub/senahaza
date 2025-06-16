package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;
import lombok.experimental.SuperBuilder;


@Data
@SuperBuilder
public class ItemResponseDto {

    private Long itemId;
    private String itemName;
    private Double ruby;
    private String img;
}
