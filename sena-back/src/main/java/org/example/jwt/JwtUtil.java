package org.example.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // 토큰 생성
    public String createToken(String username, String email, String role) {
        Date now = new Date();
        // 6시간 = 6 * 60 * 60 * 1000 밀리초
        long expirationMs = 6 * 60 * 60 * 1000;
        Date expiryDate = new Date(now.getTime() + expirationMs);

        String token = Jwts.builder()
                .subject(username)
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();

        log.info("JWT 토큰 생성: {}", token);

        return token;
    }

    // 공통 Claims 추출
    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 사용자명 추출
    public String getUsername(String token) {
        return extractClaims(token).getSubject();
    }

    // 이메일 추출
    public String getEmail(String token) {
        return extractClaims(token).get("email", String.class);
    }

    // 역할(role) 추출
    public String getRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    // 토큰 만료 여부 확인
    public boolean isTokenExpired(String token) {
        Date expiration = extractClaims(token).getExpiration();
        return expiration.before(new Date());
    }

    // 전체 유효성 검사 (서명 + 만료)  >>> 로직 추가 예정
    public boolean validateToken(String token) {
        try {
            Claims claims = extractClaims(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
