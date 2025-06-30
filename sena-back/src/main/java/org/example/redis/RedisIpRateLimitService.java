package org.example.redis;


import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisIpRateLimitService {

    private final RedisTemplate<String, String> redisTemplate;

    public boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    public Long increment(String key, long delta) {
        return redisTemplate.opsForValue().increment(key, delta);
    }

    public void expire(String key, Duration duration) {
        redisTemplate.expire(key, duration);
    }

    public void set(String key, String value, Duration duration) {
        redisTemplate.opsForValue().set(key, value, duration);
    }
}