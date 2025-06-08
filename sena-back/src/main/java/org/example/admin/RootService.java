package org.example.admin;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminDto;
import org.example.admin.dto.AdminListResponseDto;
import org.example.admin.dto.SignListResponseDto;
import org.example.admin.dto.SignListResponseWrapperDto;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.admin.repository.PendingAdminRepository;
import org.example.exception.customException.SameRoleException;
import org.example.jwt.RedisService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RootService {

    private final PasswordEncoder passwordEncoder;
    private final AdminRepository adminRepository;
    private final PendingAdminRepository pendingAdminRepository;
    private final RedisService redisService;

    // root 권한을 가진 유저의 회원가입 목록 요청
    public SignListResponseWrapperDto getSignList() {
        List<SignListResponseDto> signList = pendingAdminRepository.findAll()
                .stream()
                .map(pendingAdmin -> SignListResponseDto.builder()
                        .pendingAdminId(pendingAdmin.getPendingAdminId())
                        .name(pendingAdmin.getName())
                        .dept(pendingAdmin.getDept())
                        .email(pendingAdmin.getEmail())
                        .tel(pendingAdmin.getTel())
                        .requestedAt(pendingAdmin.getRequestedAt().toString())
                        .build()
                ).collect(Collectors.toList());

        log.info("회원가입 목록 조회: {}", signList);
        log.info("회원가입 목록 개수: {}", signList.size());

        return SignListResponseWrapperDto.builder()
                .signList(signList)
                .count(signList.size())
                .build();
    }
    // root 권한을 가진 유저의 회원가입 승인
    @Transactional
    public void approveSignUp(List<Long> pendingAdminIds) {
        for (Long pendingAdminId : pendingAdminIds) {
            // 해당 유저의 PendingAdmin 엔티티 조회
            pendingAdminRepository.findById(pendingAdminId).ifPresent(pendingAdmin -> {
                // 새로운 AdminEntity 생성
                AdminEntity newAdmin = AdminEntity.builder()
                        .name(pendingAdmin.getName())
                        .dept(pendingAdmin.getDept())
                        .email(pendingAdmin.getEmail())
                        .tel(pendingAdmin.getTel())
                        .password(pendingAdmin.getPassword())
                        .role(AdminEntity.Role.valueOf("VIEWER")) // 기본적으로 VIEWER 권한 부여
                        .status(AdminEntity.Status.ACTIVE) // 상태를 ACTIVE로 설정
                        .build();

                // AdminRepository에 저장
                adminRepository.save(newAdmin);

                // PendingAdmin 엔티티 삭제
                pendingAdminRepository.delete(pendingAdmin);

                log.info("회원가입 승인 완료: {}", newAdmin);
            });
        }
    }

    // root 권한을 가진 유저의 회원가입 거절
    public void rejectSignUp(List<Long> pendingAdminIds) {
        for (Long pendingAdminId : pendingAdminIds) {
            // 해당 유저의 PendingAdmin 엔티티 조회
            pendingAdminRepository.findById(pendingAdminId).ifPresent(pendingAdmin -> {
                // PendingAdmin 엔티티 삭제
                pendingAdminRepository.delete(pendingAdmin);
                log.info("회원가입 거절 완료: {}", pendingAdmin);
            });
        }
    }

    // root 권한을 가진 유저의 다른 관리자 목록 조회
    public AdminListResponseDto getAdminList(int page, String sortBy) {
        final int pageSize = 20;
        int pageIndex = (page < 1) ? 0 : page - 1; // 인데스가 0부터 시작이라...

        Sort sort = Sort.by(Sort.Direction.ASC, sortBy);

        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, sort);
        Page<AdminEntity> adminPage = adminRepository.findAll(pageRequest);

        List<AdminDto> adminList = adminPage.getContent().stream()
                .map(admin -> AdminDto.builder()
                        .adminId(admin.getAdminId())
                        .name(admin.getName())
                        .role(admin.getRole())
                        .dept(admin.getDept())
                        .email(admin.getEmail())
                        .tel(admin.getTel())
                        .lastLoginAt(admin.getLastLoginAt())
                        .createdAt(admin.getCreatedAt())
                        .updatedAt(admin.getUpdatedAt())
                        .status(admin.getStatus())
                        .build())
                .collect(Collectors.toList());

        return AdminListResponseDto.builder()
                .adminList(adminList)
                .count((int) adminPage.getTotalElements())
                .totalPages(adminPage.getTotalPages())
                .currentPage(page)
                .build();
    }

    // root 권한을 가진 유저의 다른 관리자 권한 변경 - 1명씩만
    @Transactional
    public void changeAdminRole(Long adminId, String role) {
        // role 값이 유효한지 확인
        if (role == null || (!role.equals("VIEWER") && !role.equals("EDITOR") && !role.equals("ROOT"))) {
            throw new IllegalArgumentException("유효하지 않은 역할입니다. VIEWER, EDITOR, ADMIN 중 하나를 선택하세요.");
        }

        AdminEntity admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("해당 관리자가 존재하지 않습니다. ID: " + adminId));

        // 현재 역할과 동일한 경우 예외 처리
        if (admin.getRole().name().equals(role)) {
            throw new SameRoleException("이미 동일한 역할입니다: " + admin.getRole().name());
        }
        // 역할 변경
        admin.setRole(AdminEntity.Role.valueOf(role));
        adminRepository.save(admin);

        String email = admin.getEmail();
        Set<String> activeJtis = redisService.getUserActiveTokens(email);

        for (String jti : activeJtis) {
            // 토큰 만료시간 조회 (Redis에서 JTI 키 TTL 구하기)
            Long expirationMillis = redisService.getExpirationMillis("jti:" + jti);
            if (expirationMillis == null || expirationMillis <= 0) {
                // 만료시간 정보가 없으면 기본값 적용 (예: 1시간)
                expirationMillis = 3600 * 1000L;
            }

            // 활성 토큰 삭제
            redisService.deleteActiveToken(jti);

            // 블랙리스트 등록 (토큰 만료시간 기준)
            redisService.blacklistToken(jti, expirationMillis);
        }

        // 활성 토큰 Set 비우기
        redisService.deleteUserActiveTokens(email);

        log.info("관리자 권한 변경 완료 및 활성 토큰 블랙리스트 처리: {} -> {}", admin.getName(), role);
    }

    @Transactional
    public void deleteAdmin(Long adminId) {
        AdminEntity admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("해당 관리자가 존재하지 않습니다. ID: " + adminId));

        // 관리자 삭제
        adminRepository.delete(admin);

        log.info("관리자 삭제 완료: {}", admin.getName());
    }

}
