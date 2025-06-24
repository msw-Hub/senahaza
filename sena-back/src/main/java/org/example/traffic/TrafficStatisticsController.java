package org.example.traffic;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/traffic")
@RequiredArgsConstructor
public class TrafficStatisticsController {

    private final TrafficLogService trafficLogService;

    private final EntityManager em;

    @GetMapping("/total-count")
    public ResponseEntity<Long> getTotalCount(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        LocalDateTime startDateTime = start != null ? start.atStartOfDay() : null;
        LocalDateTime endDateTime = end != null ? end.atTime(23,59,59) : null;

        Long count = trafficLogService.getTotalRequestCount(startDateTime, endDateTime);
        return ResponseEntity.ok(count);
    }

}
