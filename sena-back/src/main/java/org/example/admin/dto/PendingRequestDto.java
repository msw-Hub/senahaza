package org.example.admin.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

@Data
public class PendingRequestDto {
    @NotEmpty(message = "id 목록은 비어 있을 수 없습니다.")
    private List<Long> pendingAdminIds;
}
