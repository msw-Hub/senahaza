package org.example.admin.editor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.ItemRequestDto;
import org.example.admin.dto.PackageCreateRequestDto;
import org.example.exception.customException.InvalidFileException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/editor")
public class EditorController {

    private final EditorService editorService;

    /**
     * 아이템 등록 및 수정 기능을 제공하는 API입니다.
     */
    // 아이템 등록 + 이미지포함
    @PostMapping("/items")
    public ResponseEntity<?> createItem(
            @RequestParam("itemName") String itemName,
            @RequestParam("ruby") Double ruby,
            @RequestParam(value = "message", required = false) String message,
            @RequestPart("file") MultipartFile file
    ) {
        log.info("아이템 등록 요청");
        ItemRequestDto itemDto = ItemRequestDto.builder()
                .itemName(itemName)
                .ruby(ruby)
                .message(message)
                .build();

        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("파일이 비어있거나 존재하지 않습니다.");
        }

        editorService.createItem(itemDto, file);
        return ResponseEntity.ok("아이템 등록 완료");
    }

    // 아이템 정보 수정
    @PatchMapping("/items/{itemId}")
    public ResponseEntity<?> updateItem(
            @PathVariable Long itemId,
            @RequestParam(value = "itemName", required = false) String itemName,
            @RequestParam(value = "ruby", required = false) Double ruby,
            @RequestParam(value = "message", required = false) String message,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "status", required = false) String status
    ) {
        log.info("아이템 수정 요청: itemId={}", itemId);

        editorService.updateItem(itemId, itemName, ruby, message, file, status);
        return ResponseEntity.ok("아이템 수정 완료");
    }

    // 아이템 삭제
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> deleteItem(@PathVariable Long itemId) {
        log.info("아이템 삭제 요청: itemId={}", itemId);

        editorService.deleteItem(itemId);
        return ResponseEntity.ok("아이템 삭제 완료");
    }

    /**
     * 패키지 등록, 수정, 삭제 기능을 제공하는 API입니다.
     */
    // 패키지 등록
    @PostMapping("/packages")
    public ResponseEntity<?> createPackage(
            @RequestBody PackageCreateRequestDto dto
    ){
        log.info("패키지 등록 요청: {}", dto);

        editorService.createPackage(dto);
        return ResponseEntity.ok("패키지 등록 완료");
    }

    // 패키지 수정
    @PatchMapping("/packages/{packageId}")
    public ResponseEntity<?> updatePackage(
            @PathVariable Long packageId,
            @RequestBody PackageCreateRequestDto dto
    ) {
        log.info("패키지 수정 요청: packageId={}, dto={}", packageId, dto);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("auth: {}", auth);

        editorService.updatePackage(packageId, dto);
        return ResponseEntity.ok("패키지 수정 완료");
    }
}
