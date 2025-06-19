package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
@Builder
public class ItemRequestDto {

    @NotBlank (message = "아이템 이름은 필수입니다.")
    private String itemName;

    @NotNull (message = "루비는 필수입니다.")
    private Double ruby;

    private String message;
}
