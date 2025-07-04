package org.example.traffic;

public interface TopUriStatsProjection {
    String getUri();
    Long getRequestCount();
    Double getAverageResponseTime();
    Double getErrorRate();
}
