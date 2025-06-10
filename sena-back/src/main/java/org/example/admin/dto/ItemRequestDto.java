package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
@Builder
public class ItemRequestDto {

    @NotBlank
    private String itemName;

    @NotNull
    private Long ruby;

    private String message;
}
