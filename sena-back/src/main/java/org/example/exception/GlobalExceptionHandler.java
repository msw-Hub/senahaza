package org.example.exception;

import org.example.exception.customException.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpServletRequest request, String errorCode, String message) {
        // 요청에 대한 비즈니스 에러 코드를 설정
        request.setAttribute("businessErrorCode", errorCode);
        return ResponseEntity.ok(Map.of(
                "status", 200,
                "errorCode", errorCode,
                "message", message
        ));
    }

    private ResponseEntity<Map<String, Object>> buildBadRequestResponse(HttpServletRequest request, String errorCode, String message, Map<String, String> errors) {
        request.setAttribute("businessErrorCode", errorCode);
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

    @ExceptionHandler(ValidationFailedException.class)
    public ResponseEntity<Map<String, Object>> handleValidationFailed(ValidationFailedException e, HttpServletRequest request) {
        return buildBadRequestResponse(request, "VALIDATION_ERROR", e.getMessage(), e.getFieldErrors());
    }

    @ExceptionHandler(AnalyticsReportException.class)
    public ResponseEntity<Map<String, Object>> handleAnalyticsException(AnalyticsReportException e, HttpServletRequest request) {
        request.setAttribute("businessErrorCode", "ANALYTICS_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", 500,
                "errorCode", "ANALYTICS_ERROR",
                "message", "사용자 분석 데이터를 불러오는 데 실패했습니다. 관리자에게 문의하세요."
        ));
    }

    @ExceptionHandler(SameRoleException.class)
    public ResponseEntity<Map<String, Object>> handleSameRoleException(SameRoleException e, HttpServletRequest request) {
        return buildErrorResponse(request, "SAME_ROLE_ERROR", e.getMessage());
    }

    @ExceptionHandler(PendingAdminNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePendingAdminNotFoundException(PendingAdminNotFoundException e, HttpServletRequest request) {
        return buildErrorResponse(request, "PENDING_ADMIN_NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(InvalidSortFieldException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidSortField(InvalidSortFieldException e, HttpServletRequest request) {
        return buildErrorResponse(request, "INVALID_SORT_FIELD", e.getMessage());
    }

    @ExceptionHandler(PageOutOfRangeException.class)
    public ResponseEntity<Map<String, Object>> handlePageOutOfRange(PageOutOfRangeException e, HttpServletRequest request) {
        return buildErrorResponse(request, "PAGE_OUT_OF_RANGE", e.getMessage());
    }

    @ExceptionHandler(AdminNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleAdminNotFound(AdminNotFoundException e, HttpServletRequest request) {
        return buildErrorResponse(request, "ADMIN_NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(InvalidAdminRoleException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidAdminRole(InvalidAdminRoleException e, HttpServletRequest request) {
        return buildErrorResponse(request, "INVALID_ADMIN_ROLE", e.getMessage());
    }

    @ExceptionHandler(AdminStatusInvalidException.class)
    public ResponseEntity<Map<String, Object>> handleAdminStatusInvalid(AdminStatusInvalidException e, HttpServletRequest request) {
        return buildErrorResponse(request, "ADMIN_STATUS_INVALID", e.getMessage());
    }

    @ExceptionHandler(AlreadyExistingItemException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyExistingItem(AlreadyExistingItemException e, HttpServletRequest request) {
        return buildErrorResponse(request, "ALREADY_EXISTING_ITEM", e.getMessage());
    }

    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidFileName(InvalidFileException e, HttpServletRequest request) {
        return buildErrorResponse(request, "INVALID_FILE", e.getMessage());
    }

    @ExceptionHandler(ImageUploadException.class)
    public ResponseEntity<Map<String, Object>> handleImageUploadException(ImageUploadException e, HttpServletRequest request) {
        return buildErrorResponse(request, "IMAGE_UPLOAD_ERROR", e.getMessage());
    }

    @ExceptionHandler(ImageDeleteException.class)
    public ResponseEntity<Map<String, Object>> handleImageDeleteException(ImageDeleteException e, HttpServletRequest request) {
        return buildErrorResponse(request, "IMAGE_DELETE_ERROR", e.getMessage());
    }

    @ExceptionHandler(InvalidStatusException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidStatusException(InvalidStatusException e, HttpServletRequest request) {
        return buildErrorResponse(request, "INVALID_STATUS", e.getMessage());
    }

    @ExceptionHandler(ItemNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleItemNotFoundException(ItemNotFoundException e, HttpServletRequest request) {
        return buildErrorResponse(request, "ITEM_NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(PackageNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePackageNotFoundException(PackageNotFoundException e, HttpServletRequest request) {
        return buildErrorResponse(request, "PACKAGE_NOT_FOUND", e.getMessage());
    }
}
