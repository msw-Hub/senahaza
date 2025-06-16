package org.example.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "package")
@Getter
@Setter
public class PackageEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    private Long packageId;

    @Column(name = "package_name", nullable = false)
    private String packageName;

    // 연관관계
    @OneToMany(mappedBy = "packageEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PackageItemEntity> packageItems;

    @OneToMany(mappedBy = "packageEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UpdateLogEntity> updateLogs;
}
