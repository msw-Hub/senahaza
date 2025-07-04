package org.example.admin.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class AdminListResponseDto {

    private List<AdminDto> adminList; // 관리자 목록
    private int count; // 총 관리자 수
    private int totalPages; // 전체 페이지 수
    private int currentPage; // 현재 페이지 번호
}
