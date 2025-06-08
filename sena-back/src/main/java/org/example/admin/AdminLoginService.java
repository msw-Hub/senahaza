package org.example.admin;

import lombok.RequiredArgsConstructor;
import org.example.admin.repository.AdminRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminLoginService {

    private final AdminRepository adminRepository;

    @Transactional
    public void updateLastLogin(String email) {
        adminRepository.findByEmail(email).ifPresent(admin -> {
            admin.setLastLoginAt(LocalDateTime.now());
            adminRepository.save(admin);
        });
    }
}
