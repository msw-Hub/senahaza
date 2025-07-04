package org.example.admin.dto;

import lombok.Data;
import org.example.entity.BaseEntity;

@Data
public class StatusRequest {
    private BaseEntity.Status status;
}
