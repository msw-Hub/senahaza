package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PackageSummaryDto {
    private Long packageId;
    private String packageName;
}