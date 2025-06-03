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
            @RequestParam(required = true) List<Long> userIds
    ) {
        log.info("root권한 유저의 회원가입 승인 요청");
        rootService.approveSignUp(userIds);
        return ResponseEntity.ok().build();
    }

    // root 권한을 가진 유저의 회원가입 거절 요청 (여러명 한번에)
    @GetMapping("/signList/reject")
    public ResponseEntity<?> rejectSignList(
            @RequestParam(required = false) List<Long> userIds
    ) {
        log.info("root권한 유저의 회원가입 거절 요청");
        rootService.rejectSignUp(userIds);
        return ResponseEntity.ok().build();
    }

}
