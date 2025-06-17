package org.example.admin.viewer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminItemResponseDto;
import org.example.admin.dto.AdminPackageResponseDto;
import org.example.admin.dto.ItemResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    // 아이템 전체 목록 반환 - 관리자 관점
    @GetMapping("/items")
    public ResponseEntity<?> getItemList(
    ) {
        log.info("아이템 목록 요청");
        List<AdminItemResponseDto> result = viewerService.getItemList();
        return ResponseEntity.ok(result);
    }

    // 관리자 기준 패키지 정보 조회
    @GetMapping("/packages")
    public ResponseEntity<?> getPackageInfo(
    ) {
        log.info("관리자의 패키지 정보 조회 요청");
        AdminPackageResponseDto packageInfo = viewerService.getPackageInfo();
        return ResponseEntity.ok(packageInfo);
    }
}