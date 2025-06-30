package org.example.traffic;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.entity.BlockedIpEntity;
import org.example.entity.QBlockedIpEntity;
import org.example.redis.RedisIpRateLimitService;
import org.example.repository.BlockedIpRepository;
import org.example.traffic.dto.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrafficLogService {

    private final TrafficLogRepository trafficLogRepository;
    private final BlockedIpRepository blockedIpRepository;
    private final RedisIpRateLimitService redisIpRateLimitService;

    private final EntityManager em;
    private final JPAQueryFactory queryFactory;

    public void save(TrafficLogEntity entity) {
        trafficLogRepository.save(entity);
    }

    public Page<TrafficLogResponseDto> getTrafficLogs(TrafficLogRequestDto dto) {
        QTrafficLogEntity q = QTrafficLogEntity.trafficLogEntity;
        BooleanBuilder builder = new BooleanBuilder();

        // uri 포함 검색
        if (dto.getUri() != null && !dto.getUri().isEmpty()) {
            builder.and(q.uri.contains(dto.getUri()));
        }

        // 날짜 범위 필터링
        if (dto.getStartDate() != null && dto.getEndDate() != null) {
            LocalDateTime start = LocalDate.parse(dto.getStartDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
            LocalDateTime end = LocalDate.parse(dto.getEndDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atTime(LocalTime.MAX);
            builder.and(q.createdAt.between(start, end));
        }

        // HTTP 메서드
        if (dto.getHttpMethod() != null && !dto.getHttpMethod().equalsIgnoreCase("ALL")) {
            builder.and(q.httpMethod.eq(dto.getHttpMethod()));
        }

        // 상태 코드 필터링
        if (dto.getStatusCode() != null && !dto.getStatusCode().equalsIgnoreCase("ALL")) {
            switch (dto.getStatusCode()) {
                case "2xx": builder.and(q.httpStatus.between(200, 299)); break;
                case "4xx": builder.and(q.httpStatus.between(400, 499)); break;
                case "5xx": builder.and(q.httpStatus.between(500, 599)); break;
            }
        }

        // isAdmin 여부
        if (dto.getIsAdmin() != null && !dto.getIsAdmin().equalsIgnoreCase("ALL")) {
            builder.and(q.isAdmin.eq(Boolean.parseBoolean(dto.getIsAdmin())));
        }

        // errorStatus 필터링
        if (dto.getErrorStatus() != null && !dto.getErrorStatus().equalsIgnoreCase("ALL")) {
            if (dto.getErrorStatus().equalsIgnoreCase("NORMAL")) {
                builder.and(q.httpStatus.eq(200)
                        .and(q.businessErrorCode.isNull()
                                .or(q.businessErrorCode.trim().eq(""))));
            } else if (dto.getErrorStatus().equalsIgnoreCase("ERROR")) {
                builder.and(q.httpStatus.ne(200)
                        .or(q.businessErrorCode.isNotNull()
                                .and(q.businessErrorCode.trim().ne(""))));
            } else {
                builder.and(q.businessErrorCode.eq(dto.getErrorStatus()));
            }
        }

        // userId에 searchWord 포함
        if (dto.getSearchWord() != null && !dto.getSearchWord().isEmpty()) {
            builder.and(q.userId.contains(dto.getSearchWord()));
        }

        Pageable pageable = PageRequest.of(dto.getPage(), dto.getSize(), Sort.by(Sort.Direction.DESC, "createdAt"));

        List<TrafficLogEntity> result = queryFactory.selectFrom(q)
                .where(builder)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(q.createdAt.desc())
                .fetch();

        Long total = queryFactory.select(q.count())
                .from(q)
                .where(builder)
                .fetchOne();

        long totalCount = total != null ? total : 0L;

        List<TrafficLogResponseDto> content = result.stream().map(entity -> TrafficLogResponseDto.builder()
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
                .build()).collect(Collectors.toList());

        return new PageImpl<>(content, pageable, totalCount);
    }

    private String maskIp(String ip) {
        if (ip == null || ip.isEmpty()) return ip;
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return ip;
        parts[3] = "***";
        return String.join(".", parts);
    }

    public TrafficStatsResponseDto getStatistics(TrafficStatsRequestDto dto) {
        QTrafficLogEntity q = QTrafficLogEntity.trafficLogEntity;

        // 시작일, 종료일을 LocalDateTime으로 변환 (시작은 00:00:00, 종료는 23:59:59.999)
        LocalDateTime start = LocalDate.parse(dto.getStartDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
        LocalDateTime end = LocalDate.parse(dto.getEndDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atTime(LocalTime.MAX);

        // 조건 빌더 생성
        BooleanBuilder builder = new BooleanBuilder();

        // 생성일자(createdAt)가 범위 내에 있는 조건 추가
        builder.and(q.createdAt.between(start, end));

        // URI가 null 아니고 빈 문자열 아닐 경우, 포함 검색 조건 추가
        if (dto.getUri() != null && !dto.getUri().isBlank()) {
            builder.and(q.uri.contains(dto.getUri()));
        }

        // 쿼리DSL을 사용해 조건에 맞는 엔티티 리스트 조회
        List<TrafficLogEntity> logs = queryFactory.selectFrom(q)
                .where(builder)
                .fetch();

        long total = logs.size(); // 전체 로그 개수

        // HTTP 메서드별 요청 수 집계
        Map<String, Long> methodMap = logs.stream()
                .collect(Collectors.groupingBy(TrafficLogEntity::getHttpMethod, Collectors.counting()));

        // 상태 코드 그룹별 요청 수 집계 (2xx 정상, 2xx 예외, 4xx, 5xx, 기타)
        Map<String, Long> statusGroupMap = logs.stream()
                .collect(Collectors.groupingBy(log -> {
                    int status = log.getHttpStatus();
                    boolean hasBizError = log.getBusinessErrorCode() != null && !log.getBusinessErrorCode().trim().isEmpty();

                    if (status >= 200 && status < 300) {
                        if (status == 200 && !hasBizError) return "2xx_success";
                        else return "2xx_exception";
                    } else if (status >= 400 && status < 500) return "4xx";
                    else if (status >= 500 && status < 600) return "5xx";
                    else return "other";
                }, Collectors.counting()));

        // 평균 응답 시간(ms), 소수점 둘째 자리까지 반올림
        double avgResponse = logs.stream()
                .mapToInt(TrafficLogEntity::getResponseTimeMs)
                .average()
                .orElse(0.0);
        avgResponse = Math.round(avgResponse * 100.0) / 100.0;

        // 평균 DB 쿼리 실행 횟수, 소수점 둘째 자리까지 반올림
        double avgDbQuery = logs.stream()
                .mapToInt(TrafficLogEntity::getDbQueryCount)
                .average()
                .orElse(0.0);
        avgDbQuery = Math.round(avgDbQuery * 100.0) / 100.0;

        // 비즈니스 오류 코드 TOP 5 집계 (빈 값 제외)
        Map<String, Long> errorTopN = logs.stream()
                .map(TrafficLogEntity::getBusinessErrorCode)
                .filter(Objects::nonNull)
                .filter(code -> !code.trim().isEmpty())
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

        // 관리자 요청 수
        long adminCount = logs.stream().filter(TrafficLogEntity::isAdmin).count();

        // 정상 요청 수 (HTTP 200, 비즈니스 오류 코드 없음)
        long successCount = logs.stream()
                .filter(log -> log.getHttpStatus() == 200 &&
                        (log.getBusinessErrorCode() == null || log.getBusinessErrorCode().trim().isEmpty()))
                .count();

        long failureCount = total - successCount; // 실패 요청 수

        // 요청 비율 계산 (총 개수가 0일 경우 0으로 처리)
        double adminRate = total == 0 ? 0 : Math.round((adminCount * 100.0 / total) * 100.0) / 100.0;
        double successRate = total == 0 ? 0 : Math.round((successCount * 100.0 / total) * 100.0) / 100.0;
        double failureRate = total == 0 ? 0 : Math.round((failureCount * 100.0 / total) * 100.0) / 100.0;
        double userRate = total == 0 ? 0 : Math.round((100.0 - adminRate) * 100.0) / 100.0;

        // 결과 DTO 생성 및 반환
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
        LocalDateTime start = LocalDate.parse(requestDto.getStartDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
        LocalDateTime end = LocalDate.parse(requestDto.getEndDate(), DateTimeFormatter.ofPattern("yyyyMMdd")).atTime(LocalTime.MAX);
        int topN = requestDto.getTopN();

        List<TopUriStatsProjection> projections = trafficLogRepository.findTopUriStats(start, end, topN);

        // Projection → DTO 변환 및 소수점 2자리 반올림

        return projections.stream()
                .map(p -> TopUriStatsDto.builder()
                        .uri(p.getUri())
                        .requestCount(p.getRequestCount())
                        .averageResponseTime(Math.round(p.getAverageResponseTime() * 100.0) / 100.0)
                        .errorRate(Math.round(p.getErrorRate() * 100.0) / 100.0)
                        .build()
                )
                .collect(Collectors.toList());
    }

    // 차단 목록 - 현재 혹은 전체
    public Page<BlockedIpDto> findBlockedIps(BlockedIpSearchRequestDto dto) {
        if (Boolean.TRUE.equals(dto.getActive())) {
            return findActiveBlockedIps(dto);
        } else {
            return findAllBlockedIps(dto);
        }
    }

    private Page<BlockedIpDto> findAllBlockedIps(BlockedIpSearchRequestDto dto) {
        BooleanBuilder builder = buildFilterCondition(dto);
        Pageable pageable = buildPageable(dto.getPage(), dto.getSize());
        return queryBlockedIps(builder, pageable);
    }

    private Page<BlockedIpDto> findActiveBlockedIps(BlockedIpSearchRequestDto dto) {
        BooleanBuilder builder = buildActiveCondition();
        Pageable pageable = buildPageable(dto.getPage(), dto.getSize());
        return queryBlockedIps(builder, pageable);
    }

    private BooleanBuilder buildFilterCondition(BlockedIpSearchRequestDto dto) {
        QBlockedIpEntity blockedIp = QBlockedIpEntity.blockedIpEntity;
        BooleanBuilder builder = new BooleanBuilder();

        if (dto.getIp() != null && !dto.getIp().isEmpty()) {
            builder.and(blockedIp.ip.containsIgnoreCase(dto.getIp()));
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");

        if (dto.getFrom() != null && !dto.getFrom().isEmpty()) {
            LocalDateTime from = LocalDate.parse(dto.getFrom(), formatter).atStartOfDay();
            builder.and(blockedIp.blockedAt.goe(from));
        }

        if (dto.getTo() != null && !dto.getTo().isEmpty()) {
            LocalDateTime to = LocalDate.parse(dto.getTo(), formatter).atTime(LocalTime.MAX);
            builder.and(blockedIp.blockedAt.loe(to));
        }

        return builder;
    }

    private BooleanBuilder buildActiveCondition() {
        QBlockedIpEntity blockedIp = QBlockedIpEntity.blockedIpEntity;
        LocalDateTime now = LocalDateTime.now();

        return new BooleanBuilder()
                .and(blockedIp.unblockAt.isNull().or(blockedIp.unblockAt.gt(now)));
    }

    private Pageable buildPageable(int page, int size) {
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "blockedAt"));
    }

    private Page<BlockedIpDto> queryBlockedIps(BooleanBuilder builder, Pageable pageable) {
        QBlockedIpEntity blockedIp = QBlockedIpEntity.blockedIpEntity;

        long total = Optional.ofNullable(
                queryFactory.select(blockedIp.count())
                        .from(blockedIp)
                        .where(builder)
                        .fetchOne()
        ).orElse(0L);

        List<BlockedIpDto> content = queryFactory.selectFrom(blockedIp)
                .where(builder)
                .orderBy(blockedIp.blockedAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch()
                .stream()
                .map(e -> BlockedIpDto.builder()
                        .id(e.getId())
                        .ip(e.getIp())
                        .reason(e.getReason())
                        .blockedAt(e.getBlockedAt())
                        .unblockAt(e.getUnblockAt())
                        .build())
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    // IP 차단 해제
    @Transactional
    public void unblockById(Long id) {
        // 1. 차단 이력 조회
        BlockedIpEntity entity = blockedIpRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 차단 기록이 존재하지 않습니다."));

        String ip = entity.getIp();

        // 2. DB에서 삭제
        blockedIpRepository.delete(entity);

        // 3. Redis에서 해당 IP 차단 키 제거
        redisIpRateLimitService.delete("blocked_ip:" + ip);

        // 4. 요청 카운트 키도 초기화
        redisIpRateLimitService.delete("req_count:" + ip);
    }

}
