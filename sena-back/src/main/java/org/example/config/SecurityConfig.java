package org.example.config;

import lombok.RequiredArgsConstructor;
import org.example.admin.AdminLoginService;
import org.example.admin.RootService;
import org.example.jwt.JwtFilter;
import org.example.jwt.JwtLoginFilter;
import org.example.jwt.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
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
    private final AdminLoginService adminLoginService;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider(PasswordEncoder passwordEncoder, UserDetailsService userDetailsService) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setPasswordEncoder(passwordEncoder);
        provider.setUserDetailsService(userDetailsService);
        return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtLoginFilter jwtLoginFilter = new JwtLoginFilter(
                authenticationManager(http.getSharedObject(AuthenticationConfiguration.class)), jwtUtil, adminLoginService
        );
        jwtLoginFilter.setFilterProcessesUrl("/api/auth/login");

        http
                .csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                .antMatchers(
                        "/api/auth/login",
                        "/api/auth/**",
                        "/main/**"
                ).permitAll()
                .antMatchers("/root/**").hasRole("ROOT")
                .antMatchers("/editor/**").hasAnyRole("ROOT", "VIEWER")
                .antMatchers("/viewer/**").hasAnyRole("ROOT", "EDITOR", "VIEWER")
                .anyRequest().authenticated()
                .and()
                .addFilterBefore(jwtLoginFilter, UsernamePasswordAuthenticationFilter.class) // ✅ 여기 순서 중요!
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
