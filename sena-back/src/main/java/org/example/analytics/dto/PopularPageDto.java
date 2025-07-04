package org.example.analytics.dto;

import lombok.Data;

@Data
public class PopularPageDto {
    private String pageTitle;    // pageTitle 공식 명칭
    private String pagePath;   // screenName 공식 명칭
    private int views;           // screenPageViews
    private int activeUsers;     // activeUsers
    private int eventCount;      // eventCount
}
