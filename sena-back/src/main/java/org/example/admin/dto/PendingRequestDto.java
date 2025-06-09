package org.example.admin.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.List;

@Data
@Valid
public class PendingRequestDto {
    @NotBlank
    private List<Long> pendingAdminIds;
}
