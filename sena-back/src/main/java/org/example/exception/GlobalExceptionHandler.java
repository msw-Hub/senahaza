package org.example.exception;

import org.example.exception.customException.*;
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
//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<Map<String, Object>> handleGenericException(Exception e) {
//        return buildErrorResponse("INTERNAL_ERROR", "알 수 없는 오류가 발생했습니다.");
//    }

    @ExceptionHandler(SameRoleException.class)
    public ResponseEntity<Map<String, Object>> handleSameRoleException(SameRoleException e) {
        return buildErrorResponse("SAME_ROLE_ERROR", e.getMessage());
    }

    @ExceptionHandler(PendingAdminNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePendingAdminNotFoundException(PendingAdminNotFoundException e) {
        return buildErrorResponse("PENDING_ADMIN_NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(InvalidSortFieldException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidSortField(InvalidSortFieldException e) {
        return buildErrorResponse("INVALID_SORT_FIELD", e.getMessage());
    }

    @ExceptionHandler(PageOutOfRangeException.class)
    public ResponseEntity<Map<String, Object>> handlePageOutOfRange(PageOutOfRangeException e) {
        return buildErrorResponse("PAGE_OUT_OF_RANGE", e.getMessage());
    }
    @ExceptionHandler(AdminNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleAdminNotFound(AdminNotFoundException e) {
        return buildErrorResponse("ADMIN_NOT_FOUND", e.getMessage());
    }
    @ExceptionHandler(InvalidAdminRoleException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidAdminRole(InvalidAdminRoleException e) {
        return buildErrorResponse("INVALID_ADMIN_ROLE", e.getMessage());
    }
    @ExceptionHandler(AdminStatusInvalidException.class)
    public ResponseEntity<Map<String, Object>> handleAdminStatusInvalid(AdminStatusInvalidException e) {
        return buildErrorResponse("ADMIN_STATUS_INVALID", e.getMessage());
    }
    @ExceptionHandler(AlreadyExistingItemException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyExistingItem(AlreadyExistingItemException e) {
        return buildErrorResponse("ALREADY_EXISTING_ITEM", e.getMessage());
    }
    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidFileName(InvalidFileException e) {
        return buildErrorResponse("INVALID_FILE", e.getMessage());
    }
    @ExceptionHandler(ImageUploadException.class)
    public ResponseEntity<Map<String, Object>> handleImageUploadException(ImageUploadException e) {
        return buildErrorResponse("IMAGE_UPLOAD_ERROR", e.getMessage());
    }
}
