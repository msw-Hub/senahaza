package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
public class PackageCreateRequestDto {

    @NotBlank(message = "패키지 이름은 필수입니다.")
    private String packageName;

    @NotNull(message = "패키지 가격은 필수입니다.")
    @Min(value = 0, message = "패키지의 현금가는 0원 이상이어야 합니다.")
    private Double packagePrice;

    private String message;

    @NotNull(message = "아이템 목록은 필수입니다.")
    private List<PackageItemCreateDto> items;
}
