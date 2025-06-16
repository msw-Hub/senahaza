package org.example.admin.editor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.ItemRequestDto;
import org.example.exception.customException.InvalidFileException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/editor")
public class EditorController {

    private final EditorService editorService;

    // 아이템 등록 + 이미지포함
    @PostMapping("/items")
    public ResponseEntity<?> createItem(
            @RequestParam("itemName") String itemName,
            @RequestParam("ruby") Long ruby,
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
            @RequestParam(value = "ruby", required = false) Long ruby,
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
}
