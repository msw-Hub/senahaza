package org.example.entity;

import lombok.Getter;
import lombok.Setter;
import org.example.admin.entity.AdminEntity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "update_log")
@Getter
@Setter
public class UpdateLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "update_log_id")
    private Long updateLogId;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    // 연관관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private AdminEntity admin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private ItemEntity item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private PackageEntity packageEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_item_id")
    private PackageItemEntity packageItem;
}
