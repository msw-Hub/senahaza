package org.example.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_ip")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedIpEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ip;

    private LocalDateTime blockedAt;

    private LocalDateTime unblockAt;

    private String reason;
}