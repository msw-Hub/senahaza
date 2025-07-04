package org.example.traffic.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TrafficLogResponseDto {
    private Long id;
    private String httpMethod;
    private String uri;
    private int httpStatus;
    private int responseTimeMs;
    private int dbQueryCount;
    private boolean isAdmin;
    private String userId;
    private LocalDateTime createdAt;
    private String businessErrorCode;
    private String clientIp;  // 마스킹된 IP 포함
}
