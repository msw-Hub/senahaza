package org.example.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "package_item")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class PackageItemEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_item_id")
    private Long packageItemId;

    @Column(name = "quantity", nullable = false)
    private Long quantity;

    // 연관관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private PackageEntity packageEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private ItemEntity item;

    @OneToMany(mappedBy = "packageItem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UpdateLogEntity> updateLogs;
}