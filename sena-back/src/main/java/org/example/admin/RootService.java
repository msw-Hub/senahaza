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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RootService {

    private final PasswordEncoder passwordEncoder;
    private final AdminRepository adminRepository;
    private final PendingAdminRepository pendingAdminRepository;

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
    public void approveSignUp(List<Long> userIds) {
        for (Long userId : userIds) {
            // 해당 유저의 PendingAdmin 엔티티 조회
            pendingAdminRepository.findById(userId).ifPresent(pendingAdmin -> {
                // 새로운 AdminEntity 생성
                AdminEntity newAdmin = AdminEntity.builder()
                        .name(pendingAdmin.getName())
                        .dept(pendingAdmin.getDept())
                        .email(pendingAdmin.getEmail())
                        .tel(pendingAdmin.getTel())
                        .password(pendingAdmin.getPassword())
                        .role(AdminEntity.Role.valueOf("VIEWER")) // 기본적으로 VIEWER 권한 부여
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
    public void rejectSignUp(List<Long> userIds) {
        for (Long userId : userIds) {
            // 해당 유저의 PendingAdmin 엔티티 조회
            pendingAdminRepository.findById(userId).ifPresent(pendingAdmin -> {
                // PendingAdmin 엔티티 삭제
                pendingAdminRepository.delete(pendingAdmin);
                log.info("회원가입 거절 완료: {}", pendingAdmin);
            });
        }
    }

}
