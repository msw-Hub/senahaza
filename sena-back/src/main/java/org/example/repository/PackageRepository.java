package org.example.repository;

import org.example.entity.BaseEntity;
import org.example.entity.PackageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackageRepository extends JpaRepository<PackageEntity, Long> {

    List<PackageEntity> findAllByStatus(BaseEntity.Status status);
}
