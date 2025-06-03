package org.example.admin.repository;

import org.example.admin.entity.AdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<AdminEntity, Long> {
    boolean existsByEmail(String email);
}
