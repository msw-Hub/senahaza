package org.example.common.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PackageItemDto {
    private Long itemId;
    private String itemName;
    private Double ruby;
    private String imgUrl;
    private Long quantity;
}
