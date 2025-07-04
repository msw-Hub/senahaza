package org.example.analytics.dto;

import lombok.Data;

import java.util.List;

@Data
public class ReportOverviewDto {
    private UserMetricsDto userMetrics;
    private List<PopularPageDto> popularPages;
    private List<TrafficSourceDto> firstUserSources;
    private List<TrafficSourceDto> sessionSources;
    private NewVsReturningDto newVsReturning;
    private List<GeoStatDto> geoStats;
}
