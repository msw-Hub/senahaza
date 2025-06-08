package org.example.admin.entity;

import lombok.*;
import org.example.entity.BaseEntity;
import org.example.entity.UpdateLogEntity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admin")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "admin_id")
    private Long adminId;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "dept", nullable = false)
    private String dept;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "tel", nullable = false)
    private String tel;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // 연관관계
    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UpdateLogEntity> updateLogs = new ArrayList<>();

    public enum Role {
        ROOT, EDITOR, VIEWER;
        // 스프링 시큐리티 권한 반환용

        public List<org.springframework.security.core.GrantedAuthority> getAuthorities() {
            return List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + this.name()));
        }

    }
}
