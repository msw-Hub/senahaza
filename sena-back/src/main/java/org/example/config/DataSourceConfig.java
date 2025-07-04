package org.example.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;
import org.example.traffic.QueryCounterListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;

@Configuration
@RequiredArgsConstructor
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;

    private final QueryCounterListener queryCounterListener;


    /*
     * HikariCP를 사용한 실제 커넥션 풀 데이터소스 설정
     */
    @Bean
    public HikariDataSource actualDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(dbUrl);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setDriverClassName(driverClassName);
        return ds;
    }

    /*
     * ProxyDataSourceBuilder를 사용하여 HikariCP를 감싼 프록시 데이터소스를 생성
     * 쿼리 실행 시 QueryCounterListener를 통해 쿼리 수를 카운트
     * @Primary를 통해 해당 프록시 데이터소스를 기본 주입 대상으로 지정
     */
    @Bean
    @Primary // 프록시 DataSource를 기본 빈으로 설정
    public DataSource dataSource(HikariDataSource actualDataSource) {
        return ProxyDataSourceBuilder
                .create(actualDataSource)
                .name("TrackedDS")
                .listener(queryCounterListener)
                .countQuery()
                .build();
    }

}



