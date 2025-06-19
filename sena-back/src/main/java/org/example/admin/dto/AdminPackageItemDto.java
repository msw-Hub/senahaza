package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;
import org.example.entity.BaseEntity;

@Builder
@Data
public class AdminPackageItemDto {
    private Long itemId;
    private String itemName;
    private Double ruby;
    private String imgUrl;
    private Long quantity;
    private BaseEntity.Status status;
}
