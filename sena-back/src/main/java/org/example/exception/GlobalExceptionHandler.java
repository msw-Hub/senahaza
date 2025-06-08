package org.example.exception;

import org.example.exception.customException.SameRoleException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 공통 메서드: 에러코드와 메시지를 받아 200 OK 응답 반환
    private ResponseEntity<Map<String, Object>> buildErrorResponse(String errorCode, String message) {
        return ResponseEntity.ok(Map.of(
                "status", 200,
                "errorCode", errorCode,
                "message", message
        ));
    }
    // 예외가 지정되지 않은 경우의 기본 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception e) {
        return buildErrorResponse("INTERNAL_ERROR", "알 수 없는 오류가 발생했습니다.");
    }

    @ExceptionHandler(SameRoleException.class)
    public ResponseEntity<Map<String, Object>> handleSameRoleException(SameRoleException e) {
        return buildErrorResponse("SAME_ROLE_ERROR", e.getMessage());
    }
}
