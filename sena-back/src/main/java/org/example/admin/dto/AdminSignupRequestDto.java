package org.example.admin.dto;

import lombok.Data;
import javax.validation.Valid;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Data
@Valid
public class AdminSignupRequestDto {

    @NotBlank
    private String name;        // 이름

    @NotBlank
    private String dept;        // 부서

    @NotBlank
    @Email
    private String email;       // 이메일

    @NotBlank
    @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하여야 합니다.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,20}$",
            message = "비밀번호는 영문(A-z 대소문자 구분), 숫자(0-9), 특수문자(!@#$%^&*)를 모두 포함해야 합니다."
    )
    private String password;    // 비밀번호

    @NotBlank
    @Pattern(
            regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$",
            message = "전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678"
    )
    private String tel;         // 전화번호

}
