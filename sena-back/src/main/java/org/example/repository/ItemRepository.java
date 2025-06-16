package org.example.repository;

import org.example.entity.BaseEntity;
import org.example.entity.ItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {

    boolean existsByItemName(String itemName);
    boolean existsByItemNameAndStatusNot(String itemName, BaseEntity.Status status);

    List<ItemEntity> findByStatusNot(BaseEntity.Status status);

    boolean existsByItemNameAndStatusNotAndItemIdNot(String itemName, BaseEntity.Status status, Long itemId);

    List<ItemEntity> findAllByStatus(BaseEntity.Status status);

}
