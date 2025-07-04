package org.example.config;

import lombok.RequiredArgsConstructor;
import org.example.admin.all.AdminLoginService;
import org.example.filter.IpRateLimitingFilter;
import org.example.filter.TrafficLoggingFilter;
import org.example.jwt.JwtFilter;
import org.example.jwt.JwtLoginFilter;
import org.example.jwt.JwtUtil;
import org.example.redis.RedisIpRateLimitService;
import org.example.redis.RedisService;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
//@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final JwtUtil jwtUtil;
    private final AdminLoginService adminLoginService;
    private final RedisService redisService;
    private final TrafficLoggingFilter trafficLoggingFilter;
    private final RedisIpRateLimitService redisIpRateLimitService;
    private final IpRateLimitingFilter ipRateLimitingFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

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
                authenticationManager(http.getSharedObject(AuthenticationConfiguration.class)), jwtUtil, adminLoginService, redisService
        );
        jwtLoginFilter.setFilterProcessesUrl("/api/auth/login");

//        http
//                .cors()
//                .and()
//                .csrf().disable()
//                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
//                .and()
//                .authorizeRequests()
//                .antMatchers(
//                        "/api/auth/login",
//                        "/api/auth/**",
//                        "/main/**",
//                        "/"
//                ).permitAll()
//                // "/analytics/**" 와 "/admin/traffic/**" 는 여기서 권한 체크로 변경
//                .antMatchers("/admin/traffic/top-uris").hasRole("ROOT")
//                .antMatchers("/admin/traffic/**").hasAnyRole("ROOT", "EDITOR", "VIEWER")
//                .antMatchers("/analytics/**").hasAnyRole("ROOT", "EDITOR", "VIEWER")
//                .antMatchers("/root/**").hasRole("ROOT")
//                .antMatchers("/editor/**").hasAnyRole("ROOT", "EDITOR")
//                .antMatchers("/viewer/**").hasAnyRole("ROOT", "EDITOR", "VIEWER")
//                .anyRequest().authenticated()
//                .and()
//                .addFilterBefore(ipRateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
//                .addFilterBefore(trafficLoggingFilter, UsernamePasswordAuthenticationFilter.class)
//                .addFilterBefore(jwtLoginFilter, UsernamePasswordAuthenticationFilter.class)
//                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        http
                .cors().and()
                .csrf().disable()
                .authorizeRequests()
                .antMatchers(
                        "/favicon.ico",
                        "/error",
                        "/css/**",
                        "/js/**",
                        "/images/**",
                        "/webjars/**",
                        "/fonts/**"
                ).permitAll()
                .anyRequest().permitAll();

        return http.build();
    }



    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOriginPatterns(origins); // 좀 더 유연하게
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
