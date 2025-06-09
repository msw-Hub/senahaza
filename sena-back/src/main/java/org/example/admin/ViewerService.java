package org.example.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.example.entity.BaseEntity;
import org.example.exception.customException.AdminNotFoundException;
import org.example.exception.customException.AdminStatusInvalidException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ViewerService {

    private final AdminRepository adminRepository;

    public void checkStatus(String email) {
        // 이메일로 해당 관리자 계정 조회
        AdminEntity admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new AdminNotFoundException("해당 이메일의 관리자가 존재하지 않습니다."));

        //해당 유저의 상태가 ACTIVE인지 확인
        if (admin.getStatus().equals(BaseEntity.Status.valueOf("ACTIVE"))) {
            log.info("유효성 확인 완료: 이메일 = {}, 상태 = {}", email, admin.getStatus());
        } else {
            log.warn("유효성 확인 실패: 이메일 = {}, 상태 = {}", email, admin.getStatus());
            throw new AdminStatusInvalidException("해당 관리자의 상태가 유효하지 않습니다.");
        }
    }
}
