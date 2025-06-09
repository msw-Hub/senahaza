package org.example.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/viewer")
public class ViewerController {

    private final ViewerService viewerService;

    //권한을 체크하는 요청
    @GetMapping("/status")
    public ResponseEntity<?> checkStatus() {
        log.info("유효성 확인 요청 - 토큰이 유효하고, 상태값이 ACTIVE인 경우에만 접근 가능");
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        viewerService.checkStatus(email);
        return ResponseEntity.ok().body("유효성 확인되었습니다.");
    }
}