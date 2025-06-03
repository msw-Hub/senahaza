package org.example.admin.dto;

import lombok.Builder;
import lombok.Data;

import javax.validation.Valid;

@Data
@Valid
@Builder
public class SignListResponseDto {

    private Long pendingAdminId; // 대기 중인 관리자 ID
    private String name;        // 이름
    private String dept;        // 부서
    private String email;       // 이메일
    private String tel;         // 전화번호
    private String requestedAt; // 요청 시간

}
