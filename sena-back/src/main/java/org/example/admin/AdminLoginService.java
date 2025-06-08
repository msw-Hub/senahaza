package org.example.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminLoginService {

    private final AdminRepository adminRepository;

    @Transactional
    public void updateLastLogin(String email) {
        log.info("updateLastLogin 시작 - email: {}", email);

        adminRepository.findByEmail(email).ifPresentOrElse(admin -> {
            log.info("AdminEntity 조회 성공 - adminId: {}", admin.getAdminId());
            admin.setLastLoginAt(LocalDateTime.now());
            log.info("lastLoginAt 필드 변경 완료");
        }, () -> {
            log.warn("AdminEntity 없음 - email: {}", email);
        });

        log.info("updateLastLogin 종료 (트랜잭션 커밋 대기 중일 수 있음)");
    }



}
