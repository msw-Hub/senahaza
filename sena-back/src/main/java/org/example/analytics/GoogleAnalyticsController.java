package org.example.analytics;

import com.google.analytics.data.v1beta.RunReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class GoogleAnalyticsController {

    private final GoogleAnalyticsService googleAnalyticsService;

    /**
     * 일별 페이지뷰, 세션, 활성사용자 수 조회
     *
     * 요청 예) GET /api/analytics/pageviews?startDate=2025-06-01&endDate=2025-06-18
     *
     * @param startDate 조회 시작일 (yyyy-MM-dd)
     * @param endDate 조회 종료일 (yyyy-MM-dd)
     * @return Google Analytics RunReportResponse 객체(JSON 직렬화)
     */
    @GetMapping("/pageviews")
    public RunReportResponse getPageViews(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return googleAnalyticsService.getPageViews(startDate, endDate);
    }
}
