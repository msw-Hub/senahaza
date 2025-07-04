package org.example.traffic.dto;

import lombok.Data;

@Data
public class TrafficStatsRequestDto {
    private String uri;         // 포함 검색
    private String startDate;   // yyyyMMdd
    private String endDate;     // yyyyMMdd
}
