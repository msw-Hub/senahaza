package org.example.traffic;

import lombok.RequiredArgsConstructor;
import org.example.traffic.dto.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
public class TrafficLogService {

    private final TrafficLogRepository trafficLogRepository;

    public void save(TrafficLogEntity entity) {
        trafficLogRepository.save(entity);
    }

    public Page<TrafficLogResponseDto> getTrafficLogs(TrafficLogRequestDto dto) {
        Specification<TrafficLogEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // uri 포함 검색
            if (dto.getUri() != null && !dto.getUri().isEmpty()) {
                predicates.add(cb.like(root.get("uri"), "%" + dto.getUri() + "%"));
            }

            // 날짜 범위
            if (dto.getStartDate() != null && dto.getEndDate() != null) {
                LocalDateTime start = LocalDate.parse(dto.getStartDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
                LocalDateTime end = LocalDate.parse(dto.getEndDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atTime(LocalTime.MAX);
                predicates.add(cb.between(root.get("createdAt"), start, end));
            }

            // HTTP 메서드
            if (dto.getHttpMethod() != null && !dto.getHttpMethod().equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("httpMethod"), dto.getHttpMethod()));
            }

            // 상태 코드 범위
            if (dto.getStatusCode() != null && !dto.getStatusCode().equalsIgnoreCase("ALL")) {
                switch (dto.getStatusCode()) {
                    case "2xx":
                        predicates.add(cb.between(root.get("httpStatus"), 200, 299));
                        break;
                    case "4xx":
                        predicates.add(cb.between(root.get("httpStatus"), 400, 499));
                        break;
                    case "5xx":
                        predicates.add(cb.between(root.get("httpStatus"), 500, 599));
                        break;
                }
            }

            // 관리자 여부
            if (dto.getIsAdmin() != null && !dto.getIsAdmin().equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("isAdmin"), Boolean.parseBoolean(dto.getIsAdmin())));
            }

            // errorStatus 필터
            if (dto.getErrorStatus() != null && !dto.getErrorStatus().equalsIgnoreCase("ALL")) {
                if (dto.getErrorStatus().equalsIgnoreCase("NORMAL")) {
                    // 정상: HTTP 200이고, businessErrorCode가 null 또는 빈 문자열인 경우
                    predicates.add(cb.and(
                            cb.equal(root.get("httpStatus"), 200),
                            cb.or(
                                    cb.isNull(root.get("businessErrorCode")),
                                    cb.equal(cb.trim(root.get("businessErrorCode")), "")
                            )
                    ));
                } else if (dto.getErrorStatus().equalsIgnoreCase("ERROR")) {
                    // 모든 에러: HTTP 200이 아니거나, businessErrorCode가 존재하는 모든 경우
                    predicates.add(cb.or(
                            cb.notEqual(root.get("httpStatus"), 200),
                            cb.and(
                                    cb.isNotNull(root.get("businessErrorCode")),
                                    cb.notEqual(cb.trim(root.get("businessErrorCode")), "")
                            )
                    ));
                } else {
                    // 특정 커스텀 에러 코드 필터링 (예: "PACKAGE_NOT_FOUND" 등)
                    predicates.add(cb.equal(root.get("businessErrorCode"), dto.getErrorStatus()));
                }
            }

            // searchWord로 userId 포함 검색
            if (dto.getSearchWord() != null && !dto.getSearchWord().isEmpty()) {
                predicates.add(cb.like(root.get("userId"), "%" + dto.getSearchWord() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(dto.getPage(), dto.getSize(), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<TrafficLogEntity> page = trafficLogRepository.findAll(spec, pageable);

        return page.map(entity -> TrafficLogResponseDto.builder()
                .id(entity.getId())
                .httpMethod(entity.getHttpMethod())
                .uri(entity.getUri())
                .httpStatus(entity.getHttpStatus())
                .responseTimeMs(entity.getResponseTimeMs())
                .dbQueryCount(entity.getDbQueryCount())
                .isAdmin(entity.isAdmin())
                .userId(entity.getUserId())
                .createdAt(entity.getCreatedAt())
                .businessErrorCode(entity.getBusinessErrorCode())
                .clientIp(maskIp(entity.getClientIp()))
                .build());
    }

    private String maskIp(String ip) {
        if (ip == null || ip.isEmpty()) return ip;
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return ip;
        parts[3] = "***";
        return String.join(".", parts);
    }

    public TrafficStatsResponseDto getStatistics(TrafficStatsRequestDto dto) {
        LocalDateTime start = LocalDate.parse(dto.getStartDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
        LocalDateTime end = LocalDate.parse(dto.getEndDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atTime(LocalTime.MAX);

        List<TrafficLogEntity> logs = trafficLogRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("createdAt"), start, end));

            if (dto.getUri() != null && !dto.getUri().isBlank()) {
                predicates.add(cb.like(root.get("uri"), "%" + dto.getUri() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        });

        long total = logs.size();

        Map<String, Long> methodMap = logs.stream()
                .collect(Collectors.groupingBy(TrafficLogEntity::getHttpMethod, Collectors.counting()));

        Map<String, Long> statusGroupMap = logs.stream()
                .collect(Collectors.groupingBy(log -> {
                    int status = log.getHttpStatus();
                    boolean hasBizError = log.getBusinessErrorCode() != null;

                    if (status >= 200 && status < 300) {
                        if (status == 200 && !hasBizError) return "2xx_success";
                        else return "2xx_exception";
                    } else if (status >= 400 && status < 500) return "4xx";
                    else if (status >= 500 && status < 600) return "5xx";
                    else return "other";
                }, Collectors.counting()));

        double avgResponse = logs.stream()
                .mapToInt(TrafficLogEntity::getResponseTimeMs)
                .average()
                .orElse(0.0);
        avgResponse = Math.round(avgResponse * 100.0) / 100.0;

        double avgDbQuery = logs.stream()
                .mapToInt(TrafficLogEntity::getDbQueryCount)
                .average()
                .orElse(0.0);
        avgDbQuery = Math.round(avgDbQuery * 100.0) / 100.0;

        Map<String, Long> errorTopN = logs.stream()
                .map(TrafficLogEntity::getBusinessErrorCode)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(e -> e, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        long adminCount = logs.stream().filter(TrafficLogEntity::isAdmin).count();

        long successCount = logs.stream()
                .filter(log -> log.getHttpStatus() == 200 && log.getBusinessErrorCode() == null)
                .count();

        long failureCount = total - successCount;

        double adminRate = total == 0 ? 0 : Math.round((adminCount * 100.0 / total) * 100.0) / 100.0;
        double successRate = total == 0 ? 0 : Math.round((successCount * 100.0 / total) * 100.0) / 100.0;
        double failureRate = total == 0 ? 0 : Math.round((failureCount * 100.0 / total) * 100.0) / 100.0;
        double userRate = total == 0 ? 0 : Math.round((100.0 - adminRate) * 100.0) / 100.0;


        return TrafficStatsResponseDto.builder()
                .totalRequestCount(total)
                .methodCountMap(methodMap)
                .statusCodeGroupMap(statusGroupMap)
                .averageResponseTimeMs(avgResponse)
                .averageDbQueryCount(avgDbQuery)
                .businessErrorTopN(errorTopN)
                .adminRequestRate(adminRate)
                .userRequestRate(userRate)
                .successRate(successRate)
                .failureRate(failureRate)
                .build();
    }

    public List<TopUriStatsDto> getTopUriStats(TopUriStatsRequestDto requestDto) {
        String startDateStr = requestDto.getStartDate();
        String endDateStr = requestDto.getEndDate();
        int topN = requestDto.getTopN();

        // 시작일, 종료일 문자열을 LocalDateTime 타입으로 변환
        LocalDateTime start = LocalDate.parse(startDateStr, DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDateStr, DateTimeFormatter.ofPattern("yyyyMMdd")).atTime(LocalTime.MAX);

        // 지정된 기간 내 모든 트래픽 로그 조회
        List<TrafficLogEntity> logs = trafficLogRepository.findAll((root, query, cb) ->
                cb.between(root.get("createdAt"), start, end)
        );

        // 조회된 로그를 URI 기준으로 그룹화
        Map<String, List<TrafficLogEntity>> groupedByUri = logs.stream()
                .collect(Collectors.groupingBy(TrafficLogEntity::getUri));

        // 그룹별로 통계 계산 후 Top N 선별하여 리스트 반환
        return groupedByUri.entrySet().stream()
                .map(entry -> {
                    String uri = entry.getKey();
                    List<TrafficLogEntity> uriLogs = entry.getValue();

                    // URI별 요청 수 계산
                    long count = uriLogs.size();

                    // URI별 평균 응답 시간 계산
                    double avgResp = uriLogs.stream()
                            .mapToInt(TrafficLogEntity::getResponseTimeMs)
                            .average().orElse(0.0);

                    // URI별 에러 요청 수 계산 (4xx,5xx 및 HTTP 200이면서 비즈니스 에러 코드 있는 경우)
                    long errorCount = uriLogs.stream().filter(log -> {
                        int status = log.getHttpStatus();
                        boolean hasBizError = log.getBusinessErrorCode() != null;
                        return (status >= 400 && status < 600) || (status == 200 && hasBizError);
                    }).count();

                    // 에러율 계산 (소수점 둘째 자리까지 반올림)
                    double errorRate = count == 0 ? 0 : (errorCount * 100.0 / count);
                    errorRate = Math.round(errorRate * 100.0) / 100.0;

                    // 평균 응답 시간도 소수점 둘째 자리까지 반올림
                    avgResp = Math.round(avgResp * 100.0) / 100.0;

                    // DTO 생성 및 반환
                    return TopUriStatsDto.builder()
                            .uri(uri)
                            .requestCount(count)
                            .averageResponseTime(avgResp)
                            .errorRate(errorRate)
                            .build();
                })
                // 요청 수 기준 내림차순 정렬
                .sorted((a, b) -> Long.compare(b.getRequestCount(), a.getRequestCount()))
                // Top N 개 결과만 추출
                .limit(topN)
                .collect(Collectors.toList());
    }


}
