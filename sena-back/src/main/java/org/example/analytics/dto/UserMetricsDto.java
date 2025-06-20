package org.example.analytics.dto;

import lombok.Data;

@Data
public class UserMetricsDto {
    private int activeUsers;
    private int newUsers;
    private double avgEngagementTime;
    private int eventCount;
}
