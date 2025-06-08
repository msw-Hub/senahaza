package org.example.admin;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminListResponseDto;
import org.example.admin.dto.SignListResponseWrapperDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/root")
public class RootController {

    private final RootService rootService;

    // root 권한을 가진 유저의 회원가입 목록 요청
    @GetMapping("/signList")
    public ResponseEntity<?> getSignList() {
        log.info("root권한 유저의 회원가입 목록 요청");
        SignListResponseWrapperDto signList = rootService.getSignList();
        return ResponseEntity.ok(signList);
    }
    // root 권한을 가진 유저의 회원가입 승인 요청 (여러명 한번에) - 권한 VIEWER로 변경
    @GetMapping("/signList/approve")
    public ResponseEntity<?> approveSignList(
            @RequestParam(required = true) List<Long> pendingAdminIds
    ) {
        log.info("root권한 유저의 회원가입 승인 요청");
        rootService.approveSignUp(pendingAdminIds);
        return ResponseEntity.ok().build();
    }

    // root 권한을 가진 유저의 회원가입 거절 요청 (여러명 한번에)
    @GetMapping("/signList/reject")
    public ResponseEntity<?> rejectSignList(
            @RequestParam(required = false) List<Long> pendingAdminIds
    ) {
        log.info("root권한 유저의 회원가입 거절 요청");
        rootService.rejectSignUp(pendingAdminIds);
        return ResponseEntity.ok().build();
    }
    // root 권한을 가진 유저의 다른 관리자 목록 요청
    @GetMapping("/adminList")
    public ResponseEntity<?> getAdminList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "dept") String sortBy
    ) {
        log.info("root권한 유저의 관리자 목록 요청");
        AdminListResponseDto response = rootService.getAdminList(page, sortBy);
        return ResponseEntity.ok(response);
    }

    // root 권한을 가진 유저의 다른 관리자 권한 변경 - 1명씩만
    @GetMapping("/adminList/changeRole")
    public ResponseEntity<?> changeAdminRole(
            @RequestParam(required = true) Long adminId,
            @RequestParam(required = true) String role
    ) {
        log.info("root권한 유저의 관리자 권한 변경 요청: {}, role: {}", adminId, role);
        rootService.changeAdminRole(adminId, role);
        return ResponseEntity.ok().build();
    }

    // root 권한을 가진 유저의 다른 관리자 삭제 - 1명씩만
    @DeleteMapping("/adminList/delete")
    public ResponseEntity<?> deleteAdmin(
            @RequestParam(required = true) Long adminId
    ) {
        log.info("root권한 유저의 관리자 삭제 요청: {}", adminId);
        rootService.deleteAdmin(adminId);
        return ResponseEntity.ok().build();
    }

}
