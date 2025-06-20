package org.example.analytics;

import com.google.analytics.data.v1beta.*;
import com.google.api.gax.rpc.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.analytics.dto.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsReportService {

    private final BetaAnalyticsDataClient analyticsDataClient;
    private final String analyticsPropertyId;

    // 보고서 개요 시작 메서드
    public ReportOverviewDto getReportOverview(LocalDate start, LocalDate end) {
        try {
            //활성 사용자, 신규 사용자, 사용자 참여 시간, 이벤트 수
            UserMetricsDto userMetrics = getUserMetrics(start, end);
            //인기 페이지, 페이지뷰, 활성 사용자, 이벤트 수
            List<PopularPageDto> popularPages = getPopularPages(start, end);
            // 첫 사용자 소스/매체 별 활성 사용자 수 조회
            List<TrafficSourceDto> firstUserSources = getFirstUserSources(start, end);
            // 세션 소스/매체 별 세션 수 조회
            List<TrafficSourceDto> sessionSources = getSessionSources(start, end);
            // 신규 사용자 수와 재방문자 수 조회
            NewVsReturningDto newVsReturning = getNewVsReturning(start, end);
            // 시/군/구 등 지역별 활성 사용자 조회
            List<GeoStatDto> geoStats = getGeoStats(start, end);

            ReportOverviewDto dto = new ReportOverviewDto();
            dto.setUserMetrics(userMetrics);
            dto.setPopularPages(popularPages);
            dto.setFirstUserSources(firstUserSources);
            dto.setSessionSources(sessionSources);
            dto.setNewVsReturning(newVsReturning);
            dto.setGeoStats(geoStats);

            return dto;
        } catch (ApiException e) {
            log.error("Google Analytics API 호출 중 API 예외 발생. 코드: {}, 메시지: {}", e.getStatusCode().getCode(), e.getMessage(), e);
            throw e;  // 또는 적절히 변환해서 다시 던짐
        } catch (IOException e) {
            log.error("Google Analytics API 호출 중 IO 예외 발생: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    //활성 사용자, 신규 사용자, 사용자 참여 시간, 이벤트 수 조회
    private UserMetricsDto getUserMetrics(LocalDate start, LocalDate end) throws IOException {
        RunReportRequest request = RunReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDateRanges(DateRange.newBuilder()
                        .setStartDate(start.toString())
                        .setEndDate(end.toString()))
                .addMetrics(Metric.newBuilder().setName("activeUsers"))     // 활성 사용자
                .addMetrics(Metric.newBuilder().setName("newUsers"))        // 신규 사용자
                .addMetrics(Metric.newBuilder().setName("userEngagementDuration")) // 사용자 참여 시간
                .addMetrics(Metric.newBuilder().setName("eventCount"))       // 이벤트 수
                .build();

        RunReportResponse response = analyticsDataClient.runReport(request);
        UserMetricsDto dto = new UserMetricsDto();
        if (!response.getRowsList().isEmpty()) {
            Row row = response.getRows(0);
            double activeUsers = Double.parseDouble(row.getMetricValues(0).getValue());
            double newUsers = Double.parseDouble(row.getMetricValues(1).getValue());
            double engagementDuration = Double.parseDouble(row.getMetricValues(2).getValue());
            double eventCount = Double.parseDouble(row.getMetricValues(3).getValue());
            double avgEngagementTime = activeUsers > 0 ? engagementDuration / activeUsers : 0;      // 평균 참여 시간계산
            dto.setActiveUsers((int) activeUsers);
            dto.setNewUsers((int) newUsers);
            dto.setAvgEngagementTime(avgEngagementTime);
            dto.setEventCount((int) eventCount);
        } else {                        // 데이터가 없으면 0으로 초기화한 DTO 반환
            dto.setActiveUsers(0);
            dto.setNewUsers(0);
            dto.setAvgEngagementTime(0);
            dto.setEventCount(0);
        }
        return dto;
    }

    // 인기 페이지, 페이지뷰, 활성 사용자, 이벤트 수 조회
    private List<PopularPageDto> getPopularPages(LocalDate start, LocalDate end) throws IOException {
        RunReportRequest request = RunReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDateRanges(DateRange.newBuilder()
                        .setStartDate(start.toString())
                        .setEndDate(end.toString()))
                .addDimensions(Dimension.newBuilder().setName("pageTitle"))  // 페이지 제목
                .addDimensions(Dimension.newBuilder().setName("pagePath"))   // 페이지 경로(URL)
                .addMetrics(Metric.newBuilder().setName("screenPageViews"))  // 화면 페이지뷰
                .addMetrics(Metric.newBuilder().setName("activeUsers"))      // 활성 사용자
                .addMetrics(Metric.newBuilder().setName("eventCount"))       // 이벤트 수
                .setLimit(10)
                .build();

        RunReportResponse response = analyticsDataClient.runReport(request);
        List<PopularPageDto> list = new ArrayList<>();
        for (Row row : response.getRowsList()) {
            PopularPageDto dto = new PopularPageDto();
            dto.setPageTitle(row.getDimensionValues(0).getValue());
            dto.setPagePath(row.getDimensionValues(1).getValue()); // 여기 이름도 변경 필요하면 dto 필드명도 변경
            dto.setViews(Integer.parseInt(row.getMetricValues(0).getValue()));
            dto.setActiveUsers(Integer.parseInt(row.getMetricValues(1).getValue()));
            dto.setEventCount(Integer.parseInt(row.getMetricValues(2).getValue()));
            list.add(dto);
        }
        return list;
    }

    // 첫 사용자 소스/매체 별 활성 사용자 수 조회
    private List<TrafficSourceDto> getFirstUserSources(LocalDate start, LocalDate end) throws IOException {
        RunReportRequest request = RunReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDateRanges(DateRange.newBuilder()
                        .setStartDate(start.toString())
                        .setEndDate(end.toString()))
                .addDimensions(Dimension.newBuilder().setName("firstUserSource")) // 첫 방문 사용자 소스
                .addDimensions(Dimension.newBuilder().setName("firstUserMedium")) // 첫 방문 사용자 매체
                .addMetrics(Metric.newBuilder().setName("activeUsers")) // 활성 사용자
                .build();

        RunReportResponse response = analyticsDataClient.runReport(request);
        List<TrafficSourceDto> list = new ArrayList<>();
        for (Row row : response.getRowsList()) {
            TrafficSourceDto dto = new TrafficSourceDto();
            dto.setSource(row.getDimensionValues(0).getValue());
            dto.setMedium(row.getDimensionValues(1).getValue());
            dto.setCount(Integer.parseInt(row.getMetricValues(0).getValue()));
            list.add(dto);
        }
        return list;
    }

    // 세션 소스/매체 별 세션 수 조회
    private List<TrafficSourceDto> getSessionSources(LocalDate start, LocalDate end) throws IOException {
        RunReportRequest request = RunReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDateRanges(DateRange.newBuilder()
                        .setStartDate(start.toString())
                        .setEndDate(end.toString()))
                .addDimensions(Dimension.newBuilder().setName("sessionSource"))     // 세션 소스
                .addDimensions(Dimension.newBuilder().setName("sessionMedium"))     // 세션 매체
                .addMetrics(Metric.newBuilder().setName("sessions"))                // 세션 수
                .build();

        RunReportResponse response = analyticsDataClient.runReport(request);
        List<TrafficSourceDto> list = new ArrayList<>();
        for (Row row : response.getRowsList()) {
            TrafficSourceDto dto = new TrafficSourceDto();
            dto.setSource(row.getDimensionValues(0).getValue());
            dto.setMedium(row.getDimensionValues(1).getValue());
            dto.setCount(Integer.parseInt(row.getMetricValues(0).getValue()));
            list.add(dto);
        }
        return list;
    }

    // 신규 사용자 수와 재방문자 수 조회
    private NewVsReturningDto getNewVsReturning(LocalDate start, LocalDate end) throws IOException {
        RunReportRequest request = RunReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDateRanges(DateRange.newBuilder()
                        .setStartDate(start.toString())
                        .setEndDate(end.toString()))
                .addMetrics(Metric.newBuilder().setName("newUsers"))
                .addMetrics(Metric.newBuilder().setName("totalUsers"))
                .build();

        RunReportResponse response = analyticsDataClient.runReport(request);
        NewVsReturningDto dto = new NewVsReturningDto();
        if (!response.getRowsList().isEmpty()) {
            Row row = response.getRows(0);
            int newUsers = Integer.parseInt(row.getMetricValues(0).getValue());
            int totalUsers = Integer.parseInt(row.getMetricValues(1).getValue());
            int returningUsers = totalUsers - newUsers;
            dto.setNewUsers(newUsers);
            dto.setReturningUsers(returningUsers);
        } else {
            dto.setNewUsers(0);
            dto.setReturningUsers(0);
        }
        return dto;
    }

    // 시/군/구 등 지역별 활성 사용자 조회
    private List<GeoStatDto> getGeoStats(LocalDate start, LocalDate end) throws IOException {
        RunReportRequest request = RunReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDateRanges(DateRange.newBuilder()
                        .setStartDate(start.toString())
                        .setEndDate(end.toString()))
                .addDimensions(Dimension.newBuilder().setName("region"))        // 지역
                .addDimensions(Dimension.newBuilder().setName("city"))          // 도시
                .addMetrics(Metric.newBuilder().setName("activeUsers"))         // 활성 사용자
                .build();

        RunReportResponse response = analyticsDataClient.runReport(request);
        List<GeoStatDto> list = new ArrayList<>();
        for (Row row : response.getRowsList()) {
            GeoStatDto dto = new GeoStatDto();
            dto.setRegion(row.getDimensionValues(0).getValue());
            dto.setCity(row.getDimensionValues(1).getValue());
            dto.setActiveUsers(Integer.parseInt(row.getMetricValues(0).getValue()));
            list.add(dto);
        }
        return list;
    }
}
