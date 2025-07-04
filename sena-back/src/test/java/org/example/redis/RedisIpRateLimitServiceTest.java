package org.example.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RedisIpRateLimitServiceTest {

    private RedisTemplate<String, String> redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RedisIpRateLimitService redisIpRateLimitService;

    @BeforeEach
    void setUp() {
        // RedisTemplate과 내부 valueOperations mocking
        redisTemplate = mock(RedisTemplate.class);
        valueOperations = mock(ValueOperations.class);

        // RedisTemplate이 opsForValue() 호출 시 valueOperations 반환하도록 설정
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // 테스트 대상 서비스 초기화
        redisIpRateLimitService = new RedisIpRateLimitService(redisTemplate);
    }

    @Test
    void testHasKeyReturnsTrue() {
        when(redisTemplate.hasKey("blocked_ip:1.2.3.4")).thenReturn(true);

        boolean result = redisIpRateLimitService.hasKey("blocked_ip:1.2.3.4");
        assertTrue(result);
    }

    @Test
    void testHasKeyReturnsFalse() {
        when(redisTemplate.hasKey("blocked_ip:5.6.7.8")).thenReturn(false);

        boolean result = redisIpRateLimitService.hasKey("blocked_ip:5.6.7.8");
        assertFalse(result);
    }

    @Test
    void testIncrement() {
        when(valueOperations.increment("req_count:1.2.3.4", 1)).thenReturn(42L);

        Long result = redisIpRateLimitService.increment("req_count:1.2.3.4", 1);
        assertEquals(42L, result);
    }

    @Test
    void testExpire() {
        // 아무 반환값 없어도 정상적으로 호출되는지만 확인
        redisIpRateLimitService.expire("req_count:1.2.3.4", Duration.ofSeconds(60));

        verify(redisTemplate).expire("req_count:1.2.3.4", Duration.ofSeconds(60));
    }

    @Test
    void testSet() {
        redisIpRateLimitService.set("blocked_ip:1.2.3.4", "1", Duration.ofMinutes(10));

        verify(valueOperations).set("blocked_ip:1.2.3.4", "1", Duration.ofMinutes(10));
    }
}