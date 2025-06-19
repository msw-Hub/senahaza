package org.example.admin.root;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminListResponseDto;
import org.example.admin.dto.ChangeRoleRequestDto;
import org.example.admin.dto.PendingRequestDto;
import org.example.admin.dto.SignListResponseWrapperDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

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
    @PostMapping("/signList/approve")
    public ResponseEntity<?> approveSignList(
            @Valid @RequestBody PendingRequestDto pendingRequestDto
    ) {
        log.info("root권한 유저의 회원가입 승인 요청");
        rootService.approveSignUp(pendingRequestDto);
        return ResponseEntity.ok().build();
    }

    // root 권한을 가진 유저의 회원가입 거절 요청 (여러명 한번에)
    @PostMapping("/signList/reject")
    public ResponseEntity<?> rejectSignList(
            @Valid @RequestBody PendingRequestDto pendingRequestDto
    ) {
        log.info("root권한 유저의 회원가입 거절 요청");
        rootService.rejectSignUp(pendingRequestDto);
        return ResponseEntity.ok().build();
    }
    // root 권한을 가진 유저의 다른 관리자 목록 요청
    @GetMapping("/admins")
    public ResponseEntity<?> getAdminList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "dept") String sortBy
    ) {
        log.info("root권한 유저의 관리자 목록 요청");
        AdminListResponseDto response = rootService.getAdminList(page, sortBy);
        return ResponseEntity.ok(response);
    }

    // root 권한을 가진 유저의 다른 관리자 권한 변경 - 1명씩만
    @PatchMapping("/admins/{adminId}/role")
    public ResponseEntity<?> changeAdminRole(
            @PathVariable Long adminId,
            @RequestBody ChangeRoleRequestDto req
    ) {
        log.info("root권한 유저의 관리자 권한 변경 요청: {}, role: {}", adminId, req.getRole());
        rootService.changeAdminRole(adminId, req.getRole());
        return ResponseEntity.ok().build();
    }

    // root 권한을 가진 유저의 다른 관리자 삭제 - 1명씩만
    @DeleteMapping("/admins/{adminId}")
    public ResponseEntity<?> deleteAdmin(
            @PathVariable Long adminId
    ) {
        log.info("root권한 유저의 관리자 삭제 요청: {}", adminId);
        rootService.deleteAdmin(adminId);
        return ResponseEntity.ok().build();
    }

}
