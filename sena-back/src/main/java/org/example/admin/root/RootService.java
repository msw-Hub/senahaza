package org.example.admin.root;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.*;
import org.example.admin.entity.AdminEntity;
import org.example.admin.entity.PendingAdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.admin.repository.PendingAdminRepository;
import org.example.exception.customException.*;
import org.example.jwt.TokenBlacklistService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RootService {

    private final AdminRepository adminRepository;
    private final PendingAdminRepository pendingAdminRepository;
    private final TokenBlacklistService tokenBlacklistService;

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
    public void approveSignUp(PendingRequestDto pendingRequestDto) {
        List<Long> pendingAdminIds = pendingRequestDto.getPendingAdminIds();
        for (Long pendingAdminId : pendingAdminIds) {
            PendingAdminEntity pendingAdmin = pendingAdminRepository.findById(pendingAdminId)
                    .orElseThrow(() -> new PendingAdminNotFoundException("유효하지 않은 ID입니다: " + pendingAdminId)); // ← 예외 발생

            AdminEntity newAdmin = AdminEntity.builder()
                    .name(pendingAdmin.getName())
                    .dept(pendingAdmin.getDept())
                    .email(pendingAdmin.getEmail())
                    .tel(pendingAdmin.getTel())
                    .password(pendingAdmin.getPassword())
                    .role(AdminEntity.Role.VIEWER)
                    .status(AdminEntity.Status.ACTIVE)
                    .build();

            adminRepository.save(newAdmin);
            pendingAdminRepository.delete(pendingAdmin);

            log.info("회원가입 승인 완료: {}", newAdmin);
        }
    }


    // root 권한을 가진 유저의 회원가입 거절
    @Transactional
    public void rejectSignUp(PendingRequestDto pendingRequestDto) {
        List<Long> pendingAdminIds = pendingRequestDto.getPendingAdminIds();
        for (Long pendingAdminId : pendingAdminIds) {
            PendingAdminEntity pendingAdmin = pendingAdminRepository.findById(pendingAdminId)
                    .orElseThrow(() -> new PendingAdminNotFoundException("유효하지 않은 ID입니다: " + pendingAdminId)); // 예외 발생

            pendingAdminRepository.delete(pendingAdmin);
            log.info("회원가입 거절 완료: {}", pendingAdmin);
        }
    }


    // root 권한을 가진 유저의 다른 관리자 목록 조회
    public AdminListResponseDto getAdminList(int page, String sortBy) {
        final int pageSize = 20;
        int pageIndex = (page < 1) ? 0 : page - 1; // 인데스가 0부터 시작이라...

        Page<AdminEntity> adminPage;

        try {
            Sort sort = Sort.by(Sort.Direction.ASC, sortBy);
            PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, sort);
            adminPage = adminRepository.findAll(pageRequest);
        } catch (PropertyReferenceException e) {
            throw new InvalidSortFieldException("유효하지 않은 정렬 기준입니다: " + sortBy);
        }

        if (pageIndex >= adminPage.getTotalPages() && adminPage.getTotalPages() > 0) {
            throw new PageOutOfRangeException("요청한 페이지는 존재하지 않습니다: " + page);
        }

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
        if (role == null || (!role.equals("VIEWER") && !role.equals("EDITOR") && !role.equals("ROOT"))) {
            throw new InvalidAdminRoleException("유효하지 않은 역할입니다. VIEWER, EDITOR, ROOT 중 하나를 선택하세요.");
        }

        AdminEntity admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new AdminNotFoundException("해당 관리자가 존재하지 않습니다. ID: " + adminId));

        if (admin.getRole().name().equals(role)) {
            throw new SameRoleException("이미 동일한 역할입니다: " + admin.getRole().name());
        }

        admin.setRole(AdminEntity.Role.valueOf(role));
        adminRepository.save(admin);

        // 활성 토큰 블랙리스트 처리
        tokenBlacklistService.blacklistAllActiveTokens(admin.getEmail());

        log.info("관리자 권한 변경 완료 및 활성 토큰 블랙리스트 처리: {} -> {}", admin.getName(), role);
    }


    @Transactional
    public void deleteAdmin(Long adminId) {
        AdminEntity admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new AdminNotFoundException("해당 관리자가 존재하지 않습니다. ID: " + adminId));

        String email = admin.getEmail();

        adminRepository.delete(admin);
        log.info("관리자 삭제 완료: {}", admin.getName());

        // 활성 토큰 블랙리스트 처리
        tokenBlacklistService.blacklistAllActiveTokens(email);

        log.info("관리자 삭제 후 활성 토큰 블랙리스트 처리 완료: {}", email);
    }

}
