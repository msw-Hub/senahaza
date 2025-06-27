package org.example.traffic;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.traffic.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.persistence.EntityManager;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/admin/traffic")
@RequiredArgsConstructor
public class TrafficLogController {

    private final TrafficLogService trafficLogService;

    private final EntityManager em;

    @GetMapping("/logs")
    public ResponseEntity<?> getTrafficLogs(TrafficLogRequestDto requestDto) {
        Page<TrafficLogResponseDto> logs = trafficLogService.getTrafficLogs(requestDto);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics(TrafficStatsRequestDto dto) {
        TrafficStatsResponseDto response = trafficLogService.getStatistics(dto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-uris")
    public ResponseEntity<?> getTopUriStats(TopUriStatsRequestDto requestDto) {
        log.debug("GET /top-uris called with params: {}", requestDto);
        List<TopUriStatsDto> topUris = trafficLogService.getTopUriStats(requestDto);
        return ResponseEntity.ok(topUris);
    }
}
