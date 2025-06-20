package org.example.analytics.dto;

import lombok.Data;

@Data
public class RealTimePageViewDto {
    private String pageScreen;
    private int activeUsers;
}
