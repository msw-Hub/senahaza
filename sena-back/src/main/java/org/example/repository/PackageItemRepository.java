package org.example.repository;

import org.example.entity.PackageItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PackageItemRepository extends JpaRepository<PackageItemEntity, Long> {
}
