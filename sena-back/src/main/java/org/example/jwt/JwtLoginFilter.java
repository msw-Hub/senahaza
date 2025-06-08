package org.example.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.AdminLoginService;
import org.example.admin.RootService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.fasterxml.jackson.core.type.TypeReference;

import javax.servlet.FilterChain;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class JwtLoginFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AdminLoginService adminLoginService;
    private final RedisService redisService;

    // 로그인 요청 시 실행되는 메서드
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {

        log.info("[JwtLoginFilter] 로그인 시도 감지됨");

        try {
            // JSON에서 username, password 추출
            Map<String, String> loginData = new ObjectMapper().readValue(request.getInputStream(), new TypeReference<Map<String, String>>() {});

            String email = loginData.get("email");
            String password = loginData.get("password");

            UsernamePasswordAuthenticationToken authRequest =
                    new UsernamePasswordAuthenticationToken(email, password);

            // 인증 시도 (UserDetailsService와 연동)
            return authenticationManager.authenticate(authRequest);

        } catch (IOException e) {
            throw new RuntimeException("Login request parsing failed", e);
        }
    }

    // 인증 성공 시 JWT 생성 및 응답
    @Override
    protected void successfulAuthentication(HttpServletRequest request,
                                            HttpServletResponse response,
                                            FilterChain chain,
                                            Authentication authResult) throws IOException {

        String email = authResult.getName(); // getName()이 이메일임
        String role = authResult.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

        TokenInfo tokenInfo = jwtUtil.createToken(email, role);

        // ✅ Redis에 JTI 저장
        redisService.storeActiveToken(tokenInfo.getJti(), email, tokenInfo.getExpirationMs());

        try {
            adminLoginService.updateLastLogin(email);
            log.info("updateLastLogin 메서드 종료 후");
        } catch (Exception e) {
            log.error("updateLastLogin 호출 중 예외 발생", e);
        }

        log.info("인증성공! 이메일: {}, 역할: {}", email, role);
        log.info("JWT 토큰 생성: {}", tokenInfo.getToken());


        response.setContentType("application/json");
        response.getWriter().write("{\"token\":\"" + tokenInfo.getToken() + "\"}");
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed) throws IOException {
        log.error("[JwtLoginFilter] 인증 실패: {}", failed.getMessage());
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"Authentication failed: " + failed.getMessage() + "\"}");
    }

}
