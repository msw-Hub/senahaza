package org.example.common.dto;


import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PackageListResponseDto {
    private String lastUpdatedAt;
    private List<PackageDto> packages;

}
