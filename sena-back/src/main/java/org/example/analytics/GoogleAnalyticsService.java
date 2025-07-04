package org.example.analytics;

import com.google.analytics.data.v1beta.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAnalyticsService {

    private final BetaAnalyticsDataClient analyticsDataClient;
    private final String analyticsPropertyId;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * GA4에서 페이지뷰, 세션, 활성사용자 수를 조회한다.
     * @param startDate 조회 시작일
     * @param endDate 조회 종료일
     * @return RunReportResponse API 응답 객체
     */
    public RunReportResponse getPageViews(LocalDate startDate, LocalDate endDate) {
        RunReportRequest request = RunReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDateRanges(DateRange.newBuilder()
                        .setStartDate(startDate.format(DATE_FORMATTER))
                        .setEndDate(endDate.format(DATE_FORMATTER))
                        .build())
                .addMetrics(Metric.newBuilder().setName("screenPageViews").build())
                .addMetrics(Metric.newBuilder().setName("sessions").build())
                .addMetrics(Metric.newBuilder().setName("activeUsers").build())
                .addDimensions(Dimension.newBuilder().setName("date").build())
                .build();

        try {
            return analyticsDataClient.runReport(request);
        } catch (Exception e) {
            log.error("Failed to fetch GA pageviews data", e);
            throw new RuntimeException("Failed to fetch Google Analytics data", e);
        }
    }

}
