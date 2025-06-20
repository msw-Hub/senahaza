package org.example.analytics;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.analytics.dto.AnalyticsRequestDto;
import org.example.analytics.dto.ReportOverviewDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;


@Slf4j
@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsReportController {

    private final AnalyticsReportService analyticsReportService;

    @GetMapping("/reports/overview")
    public ResponseEntity<ReportOverviewDto> getReportOverview(
            @Valid AnalyticsRequestDto dto
    ) {
        log.info("Analytics Report Overview 요청: 시작일={}, 종료일={}", dto.getStart(), dto.getEnd());
        ReportOverviewDto report = analyticsReportService.getReportOverview(dto.getStart(), dto.getEnd());
        return ResponseEntity.ok(report);
    }

}
