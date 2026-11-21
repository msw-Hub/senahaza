package org.example.admin.all;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.AdminSignupRequestDto;
import org.example.admin.entity.PendingAdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.admin.repository.PendingAdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final PendingAdminRepository pendingAdminRepository;
    private final AdminRepository adminRepository;

    public void createAdminAccount( AdminSignupRequestDto dto ){
        //관리자 계정 신청
        // 요청 DTO 전체를 남기면 @Data의 toString에 비밀번호 필드까지 찍혀서 이메일만 남긴다(2026-11, 저장소 공개 정리)
        // log.info("관리자 계정 생성 요청: {}", dto);
        log.info("관리자 계정 생성 요청: {}", dto.getEmail());

        // 이메일 중복 확인
        if (adminRepository.existsByEmail(dto.getEmail())) {
            log.info("이미 존재하는 이메일: {}", dto.getEmail());
            return;
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(dto.getPassword());

        // dto를 AdminSignupRequestDto에서 PendingAdminEntity로 변환
        PendingAdminEntity pendingAdmin = PendingAdminEntity.builder()
                .name(dto.getName())
                .dept(dto.getDept())
                .email(dto.getEmail())
                .password(encodedPassword)
                .tel(dto.getTel())
                .build();

        // PendingAdminEntity 저장
        pendingAdminRepository.save(pendingAdmin);
    }

}
