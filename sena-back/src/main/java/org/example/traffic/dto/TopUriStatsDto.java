package org.example.traffic.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class TopUriStatsDto {
    private String uri;                 // 요청 URI
    private long requestCount;          // 호출 횟수
    private double averageResponseTime; // 평균 응답 시간 (ms)
    private double errorRate;           // 에러율 (%) - 4xx + 5xx + 200이지만 오류 코드 있는 경우 포함
}
