package org.example.traffic;

import lombok.RequiredArgsConstructor;
import org.example.traffic.dto.TrafficLogRequestDto;
import org.example.traffic.dto.TrafficLogResponseDto;
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

}
