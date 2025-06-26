package org.example.traffic;

import lombok.RequiredArgsConstructor;
import org.example.traffic.dto.TrafficLogRequestDto;
import org.example.traffic.dto.TrafficLogResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.persistence.EntityManager;

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

}
