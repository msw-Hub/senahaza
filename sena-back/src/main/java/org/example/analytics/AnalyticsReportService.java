package org.example.analytics;

import com.google.analytics.data.v1beta.*;
import com.google.api.gax.rpc.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.analytics.dto.*;
import org.example.exception.customException.AnalyticsReportException;
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
            throw new AnalyticsReportException("Google Analytics API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } catch (IOException e) {
            log.error("Google Analytics API 호출 중 IO 예외 발생: {}", e.getMessage(), e);
            throw new AnalyticsReportException("Google Analytics 데이터 수신 중 문제가 발생했습니다.");
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
                .addDimensions(Dimension.newBuilder().setName("date")) // 일자별 조회
                .addMetrics(Metric.newBuilder().setName("newUsers"))
                .addMetrics(Metric.newBuilder().setName("totalUsers"))
                .build();

        RunReportResponse response = analyticsDataClient.runReport(request);

        List<NewVsReturningDto.DailyUserStat> statList = new ArrayList<>();
        for (Row row : response.getRowsList()) {
            String date = row.getDimensionValues(0).getValue();
            int newUsers = Integer.parseInt(row.getMetricValues(0).getValue());
            int totalUsers = Integer.parseInt(row.getMetricValues(1).getValue());
            int returningUsers = totalUsers - newUsers;

            NewVsReturningDto.DailyUserStat stat = new NewVsReturningDto.DailyUserStat();
            stat.setDate(date);
            stat.setNewUsers(newUsers);
            stat.setReturningUsers(returningUsers);
            statList.add(stat);
        }

        NewVsReturningDto result = new NewVsReturningDto();
        result.setDailyStats(statList);
        return result;
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



    /**
     * 실시간 개요 조회 (GA4 Realtime API 기반)
     */
    public RealTimeOverviewDto getRealTimeOverview() {
        try {
            int activeUsers = getRealTimeActiveUsers();
            List<RealTimePageViewDto> pageViews = getRealTimePageViews();
            List<RealTimeEventDto> events = getRealTimeEvents();
            List<RealTimeCityDto> cities = getRealTimeCities();

            RealTimeOverviewDto dto = new RealTimeOverviewDto();
            dto.setActiveUsers(activeUsers);
            dto.setPageViews(pageViews);
            dto.setEvents(events);
            dto.setRegions(cities);
            dto.setDeviceCategories(getRealTimeDeviceCategories());

            return dto;
        } catch (Exception e) {
            log.error("실시간 데이터 조회 실패: {}", e.getMessage(), e);
            throw new AnalyticsReportException("Google Analytics 실시간 데이터 조회에 문제가 발생했습니다.");
        }
    }


    private int getRealTimeActiveUsers() throws IOException {
        RunRealtimeReportRequest request = RunRealtimeReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addMetrics(Metric.newBuilder().setName("activeUsers"))
                .build();

        RunRealtimeReportResponse response = analyticsDataClient.runRealtimeReport(request);
        if (!response.getRowsList().isEmpty()) {
            return Integer.parseInt(response.getRows(0).getMetricValues(0).getValue());
        }
        return 0;
    }

    private List<RealTimePageViewDto> getRealTimePageViews() throws IOException {
        RunRealtimeReportRequest request = RunRealtimeReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDimensions(Dimension.newBuilder().setName("unifiedScreenName"))
                .addMetrics(Metric.newBuilder().setName("activeUsers"))
                .setLimit(10)
                .build();

        RunRealtimeReportResponse response = analyticsDataClient.runRealtimeReport(request);
        List<RealTimePageViewDto> list = new ArrayList<>();
        for (Row row : response.getRowsList()) {
            RealTimePageViewDto dto = new RealTimePageViewDto();
            dto.setPageScreen(row.getDimensionValues(0).getValue());
            dto.setActiveUsers(Integer.parseInt(row.getMetricValues(0).getValue()));
            list.add(dto);
        }
        return list;
    }

    private List<RealTimeEventDto> getRealTimeEvents() throws IOException {
        RunRealtimeReportRequest request = RunRealtimeReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDimensions(Dimension.newBuilder().setName("eventName"))
                .addMetrics(Metric.newBuilder().setName("eventCount"))
                .setLimit(10)
                .build();

        RunRealtimeReportResponse response = analyticsDataClient.runRealtimeReport(request);
        List<RealTimeEventDto> list = new ArrayList<>();
        for (Row row : response.getRowsList()) {
            RealTimeEventDto dto = new RealTimeEventDto();
            dto.setEventName(row.getDimensionValues(0).getValue());
            dto.setEventCount(Integer.parseInt(row.getMetricValues(0).getValue()));
            list.add(dto);
        }
        return list;
    }

    // 지역별 실시간 활성 사용자
    private List<RealTimeCityDto> getRealTimeCities() throws IOException {
        RunRealtimeReportRequest request = RunRealtimeReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDimensions(Dimension.newBuilder().setName("city"))
                .addMetrics(Metric.newBuilder().setName("activeUsers"))
                .addOrderBys(OrderBy.newBuilder()
                        .setMetric(OrderBy.MetricOrderBy.newBuilder()
                                .setMetricName("activeUsers"))
                        .setDesc(true))
                .setLimit(10)
                .build();

        RunRealtimeReportResponse response = analyticsDataClient.runRealtimeReport(request);
        List<RealTimeCityDto> list = new ArrayList<>();

        for (Row row : response.getRowsList()) {
            RealTimeCityDto dto = new RealTimeCityDto();
            dto.setCity(getDimensionValue(row, 0, "unknown"));
            dto.setActiveUsers(getMetricIntValue(row, 0, 0));
            list.add(dto);
        }
        return list;
    }
    // 안전하게 차원 값 가져오기 (없거나 예외 시 기본값 반환)
    private String getDimensionValue(Row row, int index, String defaultValue) {
        try {
            if (row.getDimensionValuesCount() > index) {
                String val = row.getDimensionValues(index).getValue();
                if (val != null && !val.trim().isEmpty()) {
                    return val;
                }
            }
        } catch (Exception e) {
            log.debug("Dimension value extraction failed at index {}: {}", index, e.getMessage());
        }
        return defaultValue;
    }

    // 안전하게 메트릭 정수값 가져오기 (파싱 실패 시 기본값 반환)
    private int getMetricIntValue(Row row, int index, int defaultValue) {
        try {
            if (row.getMetricValuesCount() > index) {
                String val = row.getMetricValues(index).getValue();
                if (val != null && !val.trim().isEmpty()) {
                    return Integer.parseInt(val);
                }
            }
        } catch (Exception e) {
            log.debug("Metric value parsing failed at index {}: {}", index, e.getMessage());
        }
        return defaultValue;
    }

    // deviceCategory 기준 활성 사용자 조회
    private List<RealTimeDeviceCategoryDto> getRealTimeDeviceCategories() throws IOException {
        RunRealtimeReportRequest request = RunRealtimeReportRequest.newBuilder()
                .setProperty(analyticsPropertyId)
                .addDimensions(Dimension.newBuilder().setName("deviceCategory"))
                .addMetrics(Metric.newBuilder().setName("activeUsers"))
                .addOrderBys(OrderBy.newBuilder()
                        .setMetric(OrderBy.MetricOrderBy.newBuilder().setMetricName("activeUsers"))
                        .setDesc(true))
                .setLimit(10)
                .build();

        RunRealtimeReportResponse response = analyticsDataClient.runRealtimeReport(request);
        List<RealTimeDeviceCategoryDto> list = new ArrayList<>();

        for (Row row : response.getRowsList()) {
            RealTimeDeviceCategoryDto dto = new RealTimeDeviceCategoryDto();
            dto.setDeviceCategory(row.getDimensionValues(0).getValue());
            dto.setActiveUsers(Integer.parseInt(row.getMetricValues(0).getValue()));
            list.add(dto);
        }
        return list;
    }
}

