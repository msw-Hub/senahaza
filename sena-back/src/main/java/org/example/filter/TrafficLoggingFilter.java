package org.example.filter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.traffic.QueryCountHolder;
import org.example.traffic.TrafficLogEntity;
import org.example.traffic.TrafficLogService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrafficLoggingFilter extends OncePerRequestFilter {

    private final TrafficLogService trafficLogService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        QueryCountHolder.reset();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            String method = request.getMethod();
            String uri = request.getRequestURI();
            String queryString = request.getQueryString();
            String clientIp = getClientIp(request);
            int status = response.getStatus();
            int dbQueryCount = QueryCountHolder.getCount();

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = null;
            boolean isAdmin = false;
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                userId = authentication.getName();
                isAdmin = authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .anyMatch(role -> role.equals("ROLE_ROOT") || role.equals("ROLE_EDITOR") || role.equals("ROLE_VIEWER"));
            }

            String businessErrorCode = null;
            Object attr = request.getAttribute("businessErrorCode");
            if (attr instanceof String) {
                businessErrorCode = (String) attr;
            } else if (attr != null) {
                businessErrorCode = attr.toString();
            }


            TrafficLogEntity logEntity = TrafficLogEntity.builder()
                    .httpMethod(method)
                    .uri(uri)
                    .queryString(queryString)
                    .clientIp(clientIp)
                    .httpStatus(status)
                    .businessErrorCode(businessErrorCode)
                    .responseTimeMs((int) duration)
                    .isAdmin(isAdmin)
                    .userId(userId)
                    .dbQueryCount(dbQueryCount)
                    .createdAt(LocalDateTime.now())
                    .build();
            trafficLogService.save(logEntity);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // 다중 IP가 들어올 경우 첫 번째 IP만 사용
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        try {
            InetAddress inet = InetAddress.getByName(ip);
            if (inet.isLoopbackAddress()) {
                return "127.0.0.1"; // IPv6 루프백 포함해서 강제 변환
            }

            // "::ffff:192.168.0.1" 같은 IPv4-mapped IPv6 처리
            byte[] addr = inet.getAddress();
            if (addr.length == 4) {
                return inet.getHostAddress(); // IPv4 정상 반환
            }
        } catch (Exception ignored) {}

        return ip;
    }
}