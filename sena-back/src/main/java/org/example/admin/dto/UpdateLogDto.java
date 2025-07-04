package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UpdateLogDto {
    private String adminName;
    private String message;
    private String updatedAt;
}
