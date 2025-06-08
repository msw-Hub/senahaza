package org.example.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    // 로그인 요청 시 실행되는 메서드
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {

        try {
            // JSON에서 username, password 추출
            Map<String, String> loginData = new ObjectMapper().readValue(request.getInputStream(), new TypeReference<Map<String, String>>() {});

            String username = loginData.get("username");
            String password = loginData.get("password");

            UsernamePasswordAuthenticationToken authRequest =
                    new UsernamePasswordAuthenticationToken(username, password);

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

        String username = authResult.getName();
        String role = authResult.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

        String token = jwtUtil.createToken(username, "", role);

        log.info("인증 성공! 이름: {}, 권한: {}", username, role);
        log.info("JWT 토큰 생성: {}", token);

        response.setContentType("application/json");
        response.getWriter().write("{\"token\":\"" + token + "\"}");
    }
}
