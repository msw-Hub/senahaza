package org.example.repository;

import org.example.entity.ItemEntity;
import org.example.entity.PackageItemEntity;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackageItemRepository extends JpaRepository<PackageItemEntity, Long> {
    List<PackageItemEntity> findByItem(ItemEntity item);
}
