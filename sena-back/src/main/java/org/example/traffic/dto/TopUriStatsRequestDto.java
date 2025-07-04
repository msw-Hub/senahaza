package org.example.traffic.dto;

import lombok.Data;

@Data
public class TopUriStatsRequestDto {
    private String startDate;  // yyyyMMdd
    private String endDate;    // yyyyMMdd
    private int topN = 10;     // 기본값 10
}