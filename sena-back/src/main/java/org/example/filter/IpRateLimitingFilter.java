package org.example.filter;

import lombok.RequiredArgsConstructor;
import org.example.redis.BlockedIpService;
import org.example.redis.RedisIpRateLimitService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class IpRateLimitingFilter extends OncePerRequestFilter {

    // Redis에 IP별 요청 수, 차단 여부 등을 저장/조회하는 서비스
    private final RedisIpRateLimitService redisIpRateLimitService;
    private final BlockedIpService blockedIpService;

    // 허용 요청 수 최대치 (1분 동안 최대 100회)
    private static final int MAX_REQUESTS = 100;

    // 요청 카운트 만료 시간 (1분)
    private static final Duration DURATION = Duration.ofMinutes(1);

    // IP 차단 지속 시간 (60분)
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(60);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 클라이언트 IP 주소를 추출 (X-Forwarded-For 헤더 우선)
        String ip = getClientIp(request);

        // 2. Redis에서 해당 IP가 차단된 상태인지 확인
        if (redisIpRateLimitService.hasKey("blocked_ip:" + ip)) {
            // 차단 중인 IP면 403 Forbidden 응답을 보내고 요청 처리 중단
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Your IP has been temporarily blocked.");
            return;
        }

        // 3. Redis에서 해당 IP의 1분 단위 요청 수 카운트를 증가시킴
        Long count = redisIpRateLimitService.increment("req_count:" + ip, 1);

        // 4. 만약 해당 키가 새로 생성된 경우 (count == 1),
        //    요청 카운트 키의 만료시간(1분)을 설정해서 1분 후 자동 삭제되도록 함
        if (count == 1) {
            redisIpRateLimitService.expire("req_count:" + ip, DURATION);
        }

        // 5. 요청 횟수가 최대치를 넘으면 차단 처리
        if (count != null && count > MAX_REQUESTS) {
            // Redis에 차단 키를 저장하고 차단 지속시간(10분) 설정
            redisIpRateLimitService.set("blocked_ip:" + ip, "1", BLOCK_DURATION);

            // DB에 차단 기록 저장 (빌더 방식)
            blockedIpService.blockIp(
                    ip,
                    LocalDateTime.now(),
                    LocalDateTime.now().plus(BLOCK_DURATION),
                    "Rate limit exceeded"
            );

            // 429 Too Many Requests 응답 전송, 요청 처리 중단
            response.sendError(429, "Too many requests. IP temporarily blocked.");
            return;
        }

        // 6. 요청 횟수가 제한 내에 있으면 필터 체인 계속 진행
        filterChain.doFilter(request, response);
    }

    // 클라이언트 실제 IP를 얻는 헬퍼 메서드
    private String getClientIp(HttpServletRequest request) {
        // 프록시 환경 대비 X-Forwarded-For 헤더 우선 확인
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            // 여러 IP가 있을 수 있어 첫 번째 IP 사용
            return forwarded.split(",")[0];
        }
        // 헤더 없으면 요청에서 직접 IP 획득
        String ip = request.getRemoteAddr();
        // 로컬 IPv6 주소는 IPv4 localhost로 변환
        return "0:0:0:0:0:0:0:1".equals(ip) ? "127.0.0.1" : ip;
    }
}

