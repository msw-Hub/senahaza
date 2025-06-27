package org.example.traffic;

import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
@Entity
@Table(name = "traffic_log")
public class TrafficLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "uri", nullable = false)
    private String uri;

    @Column(name = "query_string")
    private String queryString;

    @Column(name = "client_ip", nullable = false, length = 45)
    private String clientIp;

    @Column(name = "http_status", nullable = false)
    private int httpStatus;

    @Column(name = "business_error_code", length = 50)  // 길이는 필요에 맞게 조절
    private String businessErrorCode;

    @Column(name = "response_time_ms", nullable = false)
    private int responseTimeMs;

    @Column(name = "is_admin", nullable = false)
    private boolean isAdmin;

    @Column(name = "user_id", length = 100)
    private String userId;

    @Column(name = "db_query_count")
    private int dbQueryCount;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
