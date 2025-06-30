package org.example.traffic.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Getter
@Setter
public class BlockedIpSearchRequestDto {

    private String ip;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime from;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime to;

    private Boolean active; // true면 현재 차단된 IP만, false/null이면 전체 조회

    private Integer page = 0;
    private Integer size = 30;

}
