package org.example.traffic;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TrafficLogRepository extends JpaRepository<TrafficLogEntity, Long>, JpaSpecificationExecutor<TrafficLogEntity> {
}
