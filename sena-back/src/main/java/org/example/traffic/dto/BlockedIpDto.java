package org.example.traffic.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BlockedIpDto {

    private Long id;
    private String ip;
    private String reason;
    private LocalDateTime blockedAt;
    private LocalDateTime unblockAt;
}