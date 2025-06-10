package org.example.repository;

import org.example.entity.UpdateLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UpdateLogRepository extends JpaRepository<UpdateLogEntity,Long> {
}
