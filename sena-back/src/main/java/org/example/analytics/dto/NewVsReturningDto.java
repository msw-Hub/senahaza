package org.example.analytics.dto;

import lombok.Data;

import java.util.List;

@Data
public class NewVsReturningDto {
    private List<DailyUserStat> dailyStats;

    @Data
    public static class DailyUserStat {
        private String date;         // yyyy-MM-dd
        private int newUsers;
        private int returningUsers;
    }
}