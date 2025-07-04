package org.example.analytics.dto;

import lombok.Data;

@Data
public class GeoStatDto {
    private String region;
    private String city;
    private int activeUsers;
}
