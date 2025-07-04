package org.example.entity;

import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "package")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(force = true)
public class PackageEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    private Long packageId;

    @Column(name = "package_name", nullable = false)
    private String packageName;

    @Column(name = "package_price", nullable = false)
    private Double packagePrice;    // 패키지 실제 현금가

    // 연관관계
    @Builder.Default
    @OneToMany(mappedBy = "packageEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<PackageItemEntity> packageItems = new ArrayList<>();

    @OneToMany(mappedBy = "packageEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UpdateLogEntity> updateLogs;

}
