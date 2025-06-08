package org.example.admin.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pending_admin")
public class PendingAdminEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pending_admin_id")
    private Long pendingAdminId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String dept;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String tel;

    @Column(nullable = false)
    private String password;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }
}
