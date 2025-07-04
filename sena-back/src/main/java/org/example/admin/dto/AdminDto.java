package org.example.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.example.admin.entity.AdminEntity;
import org.example.entity.BaseEntity;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class AdminDto {

    private Long adminId;
    private String name;
    private AdminEntity.Role role;
    private String dept;
    private String email;
    private String tel;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BaseEntity.Status status;

}
