package org.example.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, String> redisTemplate;

    public void storeActiveToken(String jti, long expirationMillis) {
        redisTemplate.opsForValue().set("jti:" + jti, "valid", expirationMillis, TimeUnit.MILLISECONDS);
    }

    public boolean isBlacklisted(String jti) {
        return redisTemplate.hasKey("jti:" + jti + ":blacklist");
    }

    public void blacklistToken(String jti, long expirationMillis) {
        redisTemplate.opsForValue().set("jti:" + jti + ":blacklist", "blacklisted", expirationMillis, TimeUnit.MILLISECONDS);
    }
}
