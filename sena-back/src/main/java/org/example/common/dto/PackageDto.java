package org.example.common.dto;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
public class PackageDto {
    private Long packageId;
    private String packageName;
    private Double totalRuby;
    private Double totalCash;
    private Double packagePrice;
    private List<PackageItemDto> items;
}
