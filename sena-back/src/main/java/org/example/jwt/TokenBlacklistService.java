package org.example.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private static final String BLACKLIST_PREFIX = "blacklist:";


    // JTI 블랙리스트에 등록 (TTL 설정) - 자동 만료 처리
    public void addToBlacklist(String jti, Duration ttl) {
        String key = BLACKLIST_PREFIX + jti;
        redisTemplate.opsForValue().set(key, "true", ttl);
    }

    // JTI가 블랙리스트에 있는지 확인
    public boolean isBlacklisted(String jti) {
        String key = BLACKLIST_PREFIX + jti;
        return redisTemplate.hasKey(key);
    }
}
