package org.example.admin.repository;

import org.example.admin.entity.AdminEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<AdminEntity, Long> {
    boolean existsByEmail(String email);

    Optional<AdminEntity> findByEmail(String name);
}
