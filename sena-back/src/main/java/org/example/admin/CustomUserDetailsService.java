package org.example.admin;

import lombok.RequiredArgsConstructor;
import org.example.admin.entity.AdminEntity;
import org.example.admin.repository.AdminRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // DB에서 username으로 관리자 조회, 없으면 예외 발생
        AdminEntity admin = adminRepository.findByName(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // UserDetails 객체 생성 및 반환
        return new org.springframework.security.core.userdetails.User(
                admin.getName(),            // 사용자 이름
                admin.getPassword(),        // 암호화된 비밀번호
                true,                      // 계정 활성화 여부 (true: 활성화)
                true,                      // 계정 만료 여부 (true: 만료 안됨)
                true,                      // 자격증명(비밀번호) 만료 여부 (true: 만료 안됨)
                true,                      // 계정 잠김 여부 (true: 잠기지 않음)
                admin.getRole().getAuthorities()  // 권한 리스트
        );
    }

}
