package org.example.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.all.AdminLoginService;
import org.example.redis.RedisService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.fasterxml.jackson.core.type.TypeReference;

import javax.servlet.FilterChain;
import javax.servlet.http.Cookie;
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
        // 발급한 JWT를 로그에 남기지 않는다. 로그만 보고도 토큰을 쓸 수 있기 때문이다(2026-11, 저장소 공개 정리)
        // log.info("JWT 토큰 생성: {}", tokenInfo.getToken());


//        Cookie cookie = new Cookie("token", tokenInfo.getToken());
//        cookie.setHttpOnly(true);         // JS에서 접근 불가 (보안)
//        cookie.setSecure(true);           // HTTPS 환경에서만 전송
//        cookie.setPath("/");              // 전체 경로에 적용
//        cookie.setMaxAge((int)(tokenInfo.getExpirationMs() / 1000));  // 만료시간 초단위로 설정
//
//        response.addCookie(cookie);
//
//        response.setContentType("application/json");
//        response.setCharacterEncoding("UTF-8");
//        response.getWriter().write("{\"message\":\"로그인 성공\"}");

        String token = tokenInfo.getToken();
        int maxAge = (int)(tokenInfo.getExpirationMs() / 1000);
        String cookieDomain = ".senahaza.store";

        // ✅ SameSite=None, Secure, Domain 수동 설정
        String cookieHeader = String.format(
                "token=%s; Max-Age=%d; Path=/; Domain=%s; HttpOnly; Secure; SameSite=None",
                token,
                maxAge,
                cookieDomain
        );

        response.addHeader("Set-Cookie", cookieHeader);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\":\"로그인 성공\"}");

    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                              AuthenticationException failed) throws IOException {
        log.error("[JwtLoginFilter] 인증 실패: {}", failed.getMessage());
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json; charset=UTF-8"); // 🔥 인코딩 명시!
        response.setCharacterEncoding("UTF-8");                     // 🔥 인코딩 명시!
        response.getWriter().write("{\"error\": \"이메일 또는 비밀번호가 올바르지 않습니다" + "\"}");
    }

}
