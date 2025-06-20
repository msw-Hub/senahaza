package org.example.analytics.dto;

import lombok.Data;

import java.util.List;

@Data
public class RealTimeOverviewDto {
    private int activeUsers;
    private List<RealTimePageViewDto> pageViews;
    private List<RealTimeEventDto> events;
    private List<RealTimeCityDto> regions;
    private List<RealTimeDeviceCategoryDto> deviceCategories;
}
