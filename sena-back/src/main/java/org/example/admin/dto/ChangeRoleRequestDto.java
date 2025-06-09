package org.example.admin.dto;

import lombok.Data;

import javax.validation.Valid;

@Data
@Valid
public class ChangeRoleRequestDto {
    private String role;
}
