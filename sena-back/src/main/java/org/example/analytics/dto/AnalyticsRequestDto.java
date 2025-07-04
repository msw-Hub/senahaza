package org.example.analytics.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.PastOrPresent;
import javax.validation.constraints.FutureOrPresent;
import javax.validation.constraints.AssertTrue;
import java.time.LocalDate;

@Data
public class AnalyticsRequestDto {

    @NotNull(message = "시작 날짜는 필수입니다.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate start;

    @NotNull(message = "종료 날짜는 필수입니다.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate end;

    @AssertTrue(message = "시작 날짜는 종료 날짜보다 이전이어야 합니다.")
    public boolean isValidDateRange() {
        if (start == null || end == null) return true; // @NotNull에서 잡음
        return start.isBefore(end) || start.isEqual(end);
    }
}
