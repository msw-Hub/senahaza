package org.example.analytics.dto;

import lombok.Data;

@Data
public class RealTimeEventDto {
    private String eventName;
    private int eventCount;
}
