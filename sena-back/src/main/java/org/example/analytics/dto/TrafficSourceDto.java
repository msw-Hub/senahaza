package org.example.analytics.dto;

import lombok.Data;

@Data
public class TrafficSourceDto {
    private String source;
    private String medium;
    private int count;  // activeUsers 또는 sessions 등 용도에 맞게 사용
}
