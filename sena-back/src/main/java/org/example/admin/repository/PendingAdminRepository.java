package org.example.admin.repository;

import org.example.admin.entity.PendingAdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingAdminRepository extends JpaRepository<PendingAdminEntity, Long> {
}
