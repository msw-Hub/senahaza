package org.example.traffic;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TrafficLogRepository extends JpaRepository<TrafficLogEntity, Long> {

    @Query(value =
            "SELECT " +
                    "    uri, " +
                    "    COUNT(*) AS requestCount, " +
                    "    AVG(response_time_ms) AS averageResponseTime, " +
                    "    100.0 * SUM( " +
                    "        CASE " +
                    "            WHEN (http_status >= 400 AND http_status < 600) " +
                    "                 OR (http_status = 200 AND business_error_code IS NOT NULL AND business_error_code <> '') " +
                    "            THEN 1 ELSE 0 " +
                    "        END " +
                    "    ) / NULLIF(COUNT(*), 0) AS errorRate " +
                    "FROM traffic_log " +
                    "WHERE created_at BETWEEN :start AND :end " +
                    "GROUP BY uri " +
                    "ORDER BY requestCount DESC " +
                    "LIMIT :topN"
            , nativeQuery = true)
    List<TopUriStatsProjection> findTopUriStats(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("topN") int topN
    );
}
