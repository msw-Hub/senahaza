package org.example.admin.all;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminSignupRequestDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/")
public class AuthController {

    private final AuthService authService;

    // 관리자 계정 생성 요청 - 최상위 관리자가 승인 해줘야함
    @PostMapping("signup")
    public ResponseEntity<?> createAdminAccount(
            @Valid @RequestBody AdminSignupRequestDto adminSignupRequestDto
    ) {
        log.info("관리자 계정 생성 요청");
        authService.createAdminAccount(adminSignupRequestDto);
        Map<String, String> response = Map.of(
                "message", "관리자 계정 생성 요청이 접수되었습니다. 승인을 기다려주세요."
        );
        return ResponseEntity.ok(response);
    }

}
