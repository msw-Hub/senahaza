package org.example.admin.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;

@Data
@Valid
public class ItemRequestDto {

    @NotBlank
    private String itemName;

    @NotBlank
    private Long ruby;

    private String message;
}
