package org.example.traffic.dto;

import lombok.Data;

@Data
public class TrafficLogRequestDto {
    private String uri;         // 포함 방식
    private String startDate;   // yyyymmdd 형식, ex) 20250601
    private String endDate;     // yyyymmdd 형식
    private String httpMethod;  // ALL 포함
    private String statusCode;  // ALL, 2xx, 4xx, 5xx
    private String isAdmin;     // ALL, true, false
    private String errorStatus; // ALL, NORMAL, ERROR
    private String searchWord;  // userId 포함 검색 및 errorStatus 검색 시 연계용
    private int page = 0;
    private int size = 30;
}
