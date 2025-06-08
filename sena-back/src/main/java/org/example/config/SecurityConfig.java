package org.example.config;

import lombok.RequiredArgsConstructor;
import org.example.jwt.JwtFilter;
import org.example.jwt.JwtLoginFilter;
import org.example.jwt.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final JwtUtil jwtUtil;

    // 인증 매니저
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // PasswordEncoder 빈 등록 (BCrypt)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // SecurityFilterChain 빈 등록
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // JwtLoginFilter 생성 시 JwtUtil 직접 전달
        JwtLoginFilter jwtLoginFilter = new JwtLoginFilter(authenticationManager(http.getSharedObject(AuthenticationConfiguration.class)), jwtUtil);
        jwtLoginFilter.setFilterProcessesUrl("/api/auth/login");

        http
                .csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                .antMatchers(
                        "/api/auth/login",   // 로그인은 누구나 접근 허용
                        "/api/auth/**",      // 관리자 계정 생성 등
                        "/main/**"           // 일반 유저 접근
                ).permitAll()
                .antMatchers("/root/**").hasRole("ROOT")
                .antMatchers("/editor/**").hasAnyRole("ROOT", "VIEWER")
                .antMatchers("/viewer/**").hasAnyRole("ROOT", "EDITOR", "VIEWER")
                .anyRequest().authenticated()
                .and()
                .addFilter(jwtLoginFilter)  // 로그인 필터 추가
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);  // JWT 검증 필터 추가

        return http.build();
    }
}
