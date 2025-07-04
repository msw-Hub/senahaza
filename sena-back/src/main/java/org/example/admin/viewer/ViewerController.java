package org.example.admin.viewer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;

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

    // 특정 아이템의 상세한 정보 조회
    @GetMapping("/items/{itemId}")
    public ResponseEntity<?> getItemDetail(
            @PathVariable Long itemId
    ) {
        log.info("아이템 상세 정보 조회 요청: itemId={}", itemId);
        ItemDetailResponseDto itemDetail = viewerService.getItemDetail(itemId);
        return ResponseEntity.ok(itemDetail);
    }

    // 특정 패키지의 상세한 정보 조회
    @GetMapping("/packages/{packageId}")
    public ResponseEntity<?> getPackageDetail(
            @PathVariable Long packageId
    ) {
        log.info("패키지 상세 정보 조회 요청: packageId={}", packageId);
        PackageDetailResponseDto packageDetail = viewerService.getPackageDetail(packageId);
        return ResponseEntity.ok(packageDetail);
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        log.info("로그아웃 요청");
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        viewerService.logout(email, request, response);
        return ResponseEntity.ok().body("로그아웃되었습니다.");
    }

    // 관리자 이름과 권한 반환
    @GetMapping("/admin/info")
    public ResponseEntity<?> getMyAdminName() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Map<String, String> viewerInfo = viewerService.getAdminInfo(email);
        return ResponseEntity.ok(viewerInfo);
    }
}