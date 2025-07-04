package org.example.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class SignListResponseWrapperDto {
    private int count;
    private List<SignListResponseDto> signList;
}
