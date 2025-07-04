package org.example.traffic.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Builder
@Data
public class TrafficStatsResponseDto {
    private long totalRequestCount;              // 전체 요청 수

    private Map<String, Long> methodCountMap;    // HTTP 메서드별 요청 수 (예: GET: 100, POST: 50)

    /**
     * 상태 코드 그룹별 요청 수:
     * - "2xx_success": 정상 (HTTP 200 + 비즈니스 오류 코드 없음)
     * - "2xx_exception": 예외 (HTTP 200 + 비즈니스 오류 코드 존재)
     * - "4xx": 클라이언트 오류
     * - "5xx": 서버 오류
     */
    private Map<String, Long> statusCodeGroupMap;

    private Map<String, Long> businessErrorTopN; // 비즈니스 오류 코드 Top N 및 건수

    private double averageResponseTimeMs;        // 평균 응답 시간(ms)

    private double averageDbQueryCount;          // 평균 DB 쿼리 실행 횟수

    // 비율 항목 (백분율)

    private double successRate;             // 정상 요청 비율 (HTTP 200 & 비즈니스 오류 코드 없음 비율)

    private double failureRate;              // 에러 요청 비율 (정상 요청이 아닌 요청 비율)

    private double userRequestRate;               // 일반 사용자 요청 비율 (관리자 아닌 요청 비율)

    private double adminRequestRate;              // 관리자 요청 비율
}