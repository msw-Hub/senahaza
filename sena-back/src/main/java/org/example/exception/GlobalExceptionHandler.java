package org.example.exception;

import org.example.exception.customException.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

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

    private ResponseEntity<Map<String, Object>> buildBadRequestResponse(String errorCode, String message, Map<String, String> errors) {
        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", 400,
                "errorCode", errorCode,
                "message", message,
                "errors", errors
        ));
    }


    // ✅ 검증 실패 처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public void handleValidationError(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "잘못된 입력입니다.",
                        (existing, replacement) -> existing
                ));
        throw new ValidationFailedException("입력값이 유효하지 않습니다.", fieldErrors);
    }

    // ✅ 위에서 던진 예외 처리
    @ExceptionHandler(ValidationFailedException.class)
    public ResponseEntity<Map<String, Object>> handleValidationFailed(ValidationFailedException e) {
        return buildBadRequestResponse("VALIDATION_ERROR", e.getMessage(), e.getFieldErrors());
    }

    // 500대 에러, 구글 애널리틱스 api 오류
    @ExceptionHandler(AnalyticsReportException.class)
    public ResponseEntity<Map<String, Object>> handleAnalyticsException(AnalyticsReportException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", 500,
                "errorCode", "ANALYTICS_ERROR",
                "message", "사용자 분석 데이터를 불러오는 데 실패했습니다. 관리자에게 문의하세요."
        ));
    }



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
    @ExceptionHandler(ImageDeleteException.class)
    public ResponseEntity<Map<String, Object>> handleImageDeleteException(ImageDeleteException e) {
        return buildErrorResponse("IMAGE_DELETE_ERROR", e.getMessage());
    }
    @ExceptionHandler(InvalidStatusException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidStatusException(InvalidStatusException e) {
        return buildErrorResponse("INVALID_STATUS", e.getMessage());
    }
    @ExceptionHandler(ItemNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleItemNotFoundException(ItemNotFoundException e) {
        return buildErrorResponse("ITEM_NOT_FOUND", e.getMessage());
    }
    @ExceptionHandler(PackageNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePackageNotFoundException(PackageNotFoundException e) {
        return buildErrorResponse("PACKAGE_NOT_FOUND", e.getMessage());
    }
}
