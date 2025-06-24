package org.example.traffic;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TrafficLogService {

    private final TrafficLogRepository trafficLogRepository;

    public void save(TrafficLogEntity entity) {
        trafficLogRepository.save(entity);
    }

    public Long getTotalRequestCount(LocalDateTime start, LocalDateTime end) {
        return trafficLogRepository.countByCreatedAtBetween(start, end);
    }
}
